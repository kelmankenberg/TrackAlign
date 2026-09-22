import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { parseFile } from 'music-metadata'
import 'dotenv/config'

const supportedExtensions = new Set(['.mp3', '.flac', '.ogg', '.m4a'])
const spotifyTokenEndpoint = 'https://accounts.spotify.com/api/token'
const spotifyApiBase = 'https://api.spotify.com/v1'
let spotifySession: { accessToken: string; refreshToken?: string; expiresAt: number } | null = null

function spotifyClientId() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('Spotify is not configured. Set SPOTIFY_CLIENT_ID in local development configuration.')
  return clientId
}

function createCodeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

function configuredRedirectUri(port: number) {
  const configured = process.env.SPOTIFY_REDIRECT_URI
  if (configured) return configured.replace('{port}', String(port))
  return `http://127.0.0.1:${port}/callback`
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
    server.listen(0, '127.0.0.1', async () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not create a local Spotify callback.'))
        return
      }
      const redirectUri = configuredRedirectUri(address.port)
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

function parseSpotifySource(sourceUrl: string) {
  const parsed = new URL(sourceUrl)
  const segments = parsed.pathname.split('/').filter(Boolean)
  const type = segments[0]
  if ((type !== 'playlist' && type !== 'album') || !segments[1]) throw new Error('Enter a Spotify playlist or album URL.')
  return { type, id: segments[1] } as { type: 'playlist' | 'album'; id: string }
}

async function loadSpotifyCollection(sourceUrl: string) {
  const source = parseSpotifySource(sourceUrl)
  const accessToken = await getSpotifyAccessToken()
  const endpoint = source.type === 'playlist' ? `${spotifyApiBase}/playlists/${source.id}/tracks?limit=50` : `${spotifyApiBase}/albums/${source.id}/tracks?limit=50`
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Spotify could not load this ${source.type} (${response.status}). Check access and the URL.`)
  const payload = await response.json() as { items: Array<{ track?: { name: string; duration_ms: number; artists: Array<{ name: string }> } }>; next?: string | null }
  const tracks = payload.items.filter((item) => item.track).map((item, index) => ({
    position: index + 1,
    artist: item.track!.artists.map((artist) => artist.name).join(', '),
    title: item.track!.name,
    duration: `${Math.floor(item.track!.duration_ms / 60000)}:${String(Math.floor(item.track!.duration_ms / 1000) % 60).padStart(2, '0')}`,
    durationMs: item.track!.duration_ms,
  }))
  return { type: source.type, name: source.type === 'playlist' ? 'Spotify playlist' : 'Spotify album', url: sourceUrl, tracks }
}

async function inspectFolder() {
  const selection = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (selection.canceled || selection.filePaths.length === 0) return { cancelled: true as const }

  const folderPath = selection.filePaths[0]
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
  ipcMain.handle('spotify:authenticate', startSpotifyAuth)
  ipcMain.handle('spotify:load-collection', (_event, sourceUrl: string) => loadSpotifyCollection(sourceUrl))
  ipcMain.on('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize())
  ipcMain.on('window:toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) window.unmaximize()
    else window?.maximize()
  })
  ipcMain.on('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close())
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
