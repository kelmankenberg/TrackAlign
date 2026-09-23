import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { parseFile } from 'music-metadata'
import 'dotenv/config'
import { applyRenames as runApplyRenames, undoLatestRename as runUndoLatestRename, type RenameItem } from '../shared/renameService'

app.disableHardwareAcceleration()

const supportedExtensions = new Set(['.mp3', '.flac', '.ogg', '.m4a'])
const spotifyTokenEndpoint = 'https://accounts.spotify.com/api/token'
const spotifyApiBase = 'https://api.spotify.com/v1'
let spotifySession: { accessToken: string; refreshToken?: string; expiresAt: number } | null = null

function spotifyClientId() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('Spotify is not configured. Copy .env.example to .env, set SPOTIFY_CLIENT_ID to your Spotify app client ID, then restart TrackAlign.')
  return clientId
}

function createCodeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

function configuredRedirectUri() {
  const configured = process.env.SPOTIFY_REDIRECT_URI
  if (configured) return configured.replace('{port}', '43821')
  return 'http://127.0.0.1:43821/callback'
}

function configuredRedirectPort() {
  const redirectUri = configuredRedirectUri()
  return Number(new URL(redirectUri).port) || 43821
}

async function exchangeSpotifyCode(code: string, verifier: string, redirectUri: string) {
  const response = await fetch(spotifyTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: spotifyClientId(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) throw new Error(`Spotify authorization failed (${response.status}). Check the redirect URI and app configuration.`)
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  spotifySession = { accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + token.expires_in * 1000 }
}

async function startSpotifyAuth() {
  const clientId = spotifyClientId()
  const verifier = randomBytes(48).toString('base64url')
  const state = randomBytes(24).toString('hex')

  return new Promise<{ authenticated: true }>((resolve, reject) => {
    let redirectUri = ''
    const server = createServer(async (request, response) => {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (requestUrl.pathname !== '/callback') {
        response.writeHead(404).end('Not found')
        return
      }

      if (requestUrl.searchParams.get('state') !== state) {
        response.writeHead(400).end('Invalid Spotify authorization state.')
        server.close()
        reject(new Error('Spotify authorization state did not match.'))
        return
      }

      const error = requestUrl.searchParams.get('error')
      if (error) {
        response.writeHead(200, { 'Content-Type': 'text/html' }).end('<h1>TrackAlign authorization cancelled</h1><p>You can close this window.</p>')
        server.close()
        reject(new Error(`Spotify authorization was not completed: ${error}.`))
        return
      }

      try {
        await exchangeSpotifyCode(requestUrl.searchParams.get('code') ?? '', verifier, redirectUri)
        response.writeHead(200, { 'Content-Type': 'text/html' }).end('<h1>TrackAlign is connected</h1><p>You can close this window and return to TrackAlign.</p>')
        server.close()
        resolve({ authenticated: true })
      } catch (exchangeError) {
        response.writeHead(500, { 'Content-Type': 'text/html' }).end('<h1>TrackAlign could not connect</h1><p>You can close this window and review the app configuration.</p>')
        server.close()
        reject(exchangeError)
      }
    })

    server.on('error', reject)
    redirectUri = configuredRedirectUri()
    server.listen(configuredRedirectPort(), '127.0.0.1', async () => {
      const authUrl = new URL('https://accounts.spotify.com/authorize')
      authUrl.search = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: createCodeChallenge(verifier),
        state,
        scope: 'playlist-read-private playlist-read-collaborative',
      }).toString()
      await shell.openExternal(authUrl.toString())
    })

    setTimeout(() => {
      server.close()
      reject(new Error('Spotify authorization timed out.'))
    }, 5 * 60 * 1000).unref()
  })
}

async function getSpotifyAccessToken() {
  if (!spotifySession) throw new Error('Connect Spotify before loading a collection.')
  if (spotifySession.expiresAt > Date.now() + 30_000) return spotifySession.accessToken
  if (!spotifySession.refreshToken) throw new Error('Spotify authorization expired. Connect again.')

  const response = await fetch(spotifyTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: spotifyClientId(), grant_type: 'refresh_token', refresh_token: spotifySession.refreshToken }),
  })
  if (!response.ok) {
    spotifySession = null
    throw new Error('Spotify authorization expired. Connect again.')
  }
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  spotifySession = { accessToken: token.access_token, refreshToken: token.refresh_token ?? spotifySession.refreshToken, expiresAt: Date.now() + token.expires_in * 1000 }
  return spotifySession.accessToken
}

async function ensureSpotifyAccessToken() {
  try {
    return await getSpotifyAccessToken()
  } catch {
    await startSpotifyAuth()
    return getSpotifyAccessToken()
  }
}

function parseSpotifySource(sourceUrl: string) {
  const parsed = new URL(sourceUrl)
  const segments = parsed.pathname.split('/').filter(Boolean)
  const type = segments[0]
  if ((type !== 'playlist' && type !== 'album') || !segments[1]) throw new Error('Enter a Spotify playlist or album URL.')
  return { type, id: segments[1] } as { type: 'playlist' | 'album'; id: string }
}

async function loadSpotifyCollection(sourceUrl: string) {
  const source = parseSpotifySource(sourceUrl)
  const accessToken = await ensureSpotifyAccessToken()
  type SpotifyTrack = { name: string; duration_ms: number; artists: Array<{ name: string }>; album?: { name: string; release_date?: string } }
  let endpoint: string | null = source.type === 'playlist' ? `${spotifyApiBase}/playlists/${source.id}/tracks?limit=50` : `${spotifyApiBase}/albums/${source.id}/tracks?limit=50`
  const sourceTracks: SpotifyTrack[] = []

  let collectionName = source.type === 'playlist' ? 'Spotify playlist' : 'Spotify album'
  let albumName = ''
  let albumYear: number | null = null
  const metaEndpoint = source.type === 'album' ? `${spotifyApiBase}/albums/${source.id}` : `${spotifyApiBase}/playlists/${source.id}?fields=name`
  const metaResponse = await fetch(metaEndpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (metaResponse.ok) {
    const metaPayload = await metaResponse.json() as { name?: string; release_date?: string }
    if (metaPayload.name) collectionName = metaPayload.name
    if (source.type === 'album') {
      albumName = metaPayload.name ?? ''
      albumYear = metaPayload.release_date ? Number(metaPayload.release_date.slice(0, 4)) || null : null
    }
  }

  while (endpoint) {
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
      const reason = body?.error?.message ? ` ${body.error.message}` : ''
      const hint = response.status === 403 && source.type === 'playlist' ? ' Spotify blocks third-party access to algorithmic playlists (Discover Weekly, Daily Mix, Release Radar, Blend, Made For You). Try a playlist you created yourself.' : ''
      throw new Error(`Spotify could not load this ${source.type} (${response.status}).${reason}${hint}`)
    }
    const payload = await response.json() as { items: Array<{ track?: SpotifyTrack } & SpotifyTrack>; next?: string | null }
    sourceTracks.push(...payload.items.map((item) => source.type === 'playlist' ? item.track : item).filter((track): track is SpotifyTrack => Boolean(track)))
    endpoint = payload.next ?? null
  }

  const tracks = sourceTracks.map((track, index) => ({
    position: index + 1,
    artist: track.artists.map((artist) => artist.name).join(', '),
    title: track.name,
    album: source.type === 'album' ? albumName : track.album?.name ?? '',
    year: source.type === 'album' ? albumYear : (track.album?.release_date ? Number(track.album.release_date.slice(0, 4)) || null : null),
    duration: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor(track.duration_ms / 1000) % 60).padStart(2, '0')}`,
    durationMs: track.duration_ms,
  }))
  return { type: source.type, name: collectionName, url: sourceUrl, tracks }
}

async function scanFolder(folderPath: string) {
  const entries = await readdir(folderPath, { withFileTypes: true })
  let ignoredSymlinkCount = 0
  const files = []

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      ignoredSymlinkCount += 1
      continue
    }

    if (!entry.isFile()) continue
    const extension = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
    if (!supportedExtensions.has(extension)) continue

    const path = join(folderPath, entry.name)
    let readOnly = false
    try {
      await access(path, constants.W_OK)
    } catch {
      readOnly = true
    }

    let metadata = {}
    try {
      const parsed = await parseFile(path, { duration: true })
      metadata = {
        title: parsed.common.title ?? '',
        artist: parsed.common.artist ?? '',
        album: parsed.common.album ?? '',
        year: parsed.common.year ?? null,
        trackNumber: parsed.common.track.no ?? null,
        durationMs: parsed.format.duration ? Math.round(parsed.format.duration * 1000) : null,
      }
    } catch {
      metadata = {}
    }

    files.push({
      name: entry.name,
      path,
      extension,
      hidden: entry.name.startsWith('.'),
      readOnly,
      metadata,
    })
  }

  return { cancelled: false as const, folderPath, ignoredSymlinkCount, files }
}

async function inspectFolder() {
  const selection = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (selection.canceled || selection.filePaths.length === 0) return { cancelled: true as const }
  return scanFolder(selection.filePaths[0])
}

function historyPath() {
  return join(app.getPath('userData'), 'rename-history.json')
}

async function applyRenames(items: RenameItem[]) {
  return runApplyRenames(items, historyPath())
}

async function undoLatestRename() {
  return runUndoLatestRename(historyPath())
}

function createWindow() {
  const window = new BrowserWindow({
    frame: false,
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: 'TrackAlign',
    icon: join(app.getAppPath(), 'resources/list-ordered.svg'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  ipcMain.handle('folder:inspect', inspectFolder)
  ipcMain.handle('folder:refresh', (_event, folderPath: string) => scanFolder(folderPath))
  ipcMain.handle('rename:apply', (_event, items: RenameItem[]) => applyRenames(items))
  ipcMain.handle('rename:undo-latest', undoLatestRename)
  ipcMain.handle('spotify:authenticate', startSpotifyAuth)
  ipcMain.handle('spotify:load-collection', (_event, sourceUrl: string) => loadSpotifyCollection(sourceUrl))
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
    return true
  })
  ipcMain.handle('window:toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) window.unmaximize()
    else window?.maximize()
    return window?.isMaximized() ?? false
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
    return true
  })
  ipcMain.handle('window:toggle-devtools', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return false
    if (window.webContents.isDevToolsOpened()) window.webContents.closeDevTools()
    else window.webContents.openDevTools({ mode: 'detach' })
    return true
  })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
