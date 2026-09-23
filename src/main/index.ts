import { app, BrowserWindow, dialog, ipcMain, Menu, screen, shell } from 'electron'
import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import 'dotenv/config'
import { applyRenames as runApplyRenames, undoLatestRename as runUndoLatestRename, type RenameItem } from '../shared/renameService'
import { fetchSpotifyCollection } from '../shared/spotify'
import { scanFolder as runScanFolder } from '../shared/folderScanner'

app.disableHardwareAcceleration()

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

async function loadSpotifyCollection(sourceUrl: string) {
  const accessToken = await ensureSpotifyAccessToken()
  return fetchSpotifyCollection(sourceUrl, accessToken, fetch, spotifyApiBase)
}

function signOutSpotify() {
  spotifySession = null
  return { signedOut: true as const }
}

function spotifyStatus() {
  return { connected: spotifySession !== null }
}

async function scanFolder(folderPath: string) {
  return runScanFolder(folderPath)
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

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
}

const defaultWindowState: WindowState = { width: 1440, height: 900, isMaximized: false }

function windowStatePath() {
  return join(app.getPath('userData'), 'window-state.json')
}

function loadWindowState(): WindowState {
  try {
    const raw = readFileSync(windowStatePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<WindowState>
    if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') return defaultWindowState
    const state: WindowState = { ...defaultWindowState, ...parsed }
    if (typeof state.x === 'number' && typeof state.y === 'number') {
      const onScreen = screen.getAllDisplays().some((display) => {
        const bounds = display.workArea
        return state.x! >= bounds.x && state.y! >= bounds.y && state.x! < bounds.x + bounds.width && state.y! < bounds.y + bounds.height
      })
      if (!onScreen) {
        state.x = undefined
        state.y = undefined
      }
    }
    return state
  } catch {
    return defaultWindowState
  }
}

function saveWindowState(window: BrowserWindow) {
  const isMaximized = window.isMaximized()
  const bounds = isMaximized ? window.getNormalBounds() : window.getBounds()
  const state: WindowState = { width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y, isMaximized }
  try {
    writeFileSync(windowStatePath(), JSON.stringify(state))
  } catch {
    // best-effort persistence; ignore write failures
  }
}

function createWindow() {
  const savedState = loadWindowState()
  const window = new BrowserWindow({
    frame: false,
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
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

  if (savedState.isMaximized) window.maximize()

  let saveTimeout: NodeJS.Timeout | undefined
  const scheduleSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => saveWindowState(window), 300)
  }
  window.on('resize', scheduleSave)
  window.on('move', scheduleSave)
  window.on('close', () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveWindowState(window)
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
  ipcMain.handle('spotify:sign-out', () => signOutSpotify())
  ipcMain.handle('spotify:status', () => spotifyStatus())
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
  ipcMain.handle('zoom:set', (event, factor: number) => {
    const webContents = BrowserWindow.fromWebContents(event.sender)?.webContents
    if (!webContents) return 1
    const clamped = Math.min(2, Math.max(0.5, factor))
    webContents.setZoomFactor(clamped)
    return clamped
  })
  ipcMain.handle('zoom:get', (event) => BrowserWindow.fromWebContents(event.sender)?.webContents.getZoomFactor() ?? 1)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
