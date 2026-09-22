import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { parseFile } from 'music-metadata'

const supportedExtensions = new Set(['.mp3', '.flac', '.ogg', '.m4a'])

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
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: 'TrackAlign',
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
  ipcMain.handle('folder:inspect', inspectFolder)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
