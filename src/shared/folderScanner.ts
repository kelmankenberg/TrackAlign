import { access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { parseFile } from 'music-metadata'

export const supportedAudioExtensions = new Set(['.mp3', '.flac', '.ogg', '.m4a'])

export interface LocalAudioFile {
  name: string
  path: string
  extension: string
  hidden: boolean
  readOnly: boolean
  metadata: {
    title?: string
    artist?: string
    album?: string
    year?: number | null
    trackNumber?: number | null
    durationMs?: number | null
  }
}

export interface FolderScan {
  cancelled: false
  folderPath: string
  ignoredSymlinkCount: number
  files: LocalAudioFile[]
}

export async function scanFolder(folderPath: string): Promise<FolderScan> {
  const entries = await readdir(folderPath, { withFileTypes: true })
  let ignoredSymlinkCount = 0
  const files: LocalAudioFile[] = []

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      ignoredSymlinkCount += 1
      continue
    }

    if (!entry.isFile()) continue
    const extension = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
    if (!supportedAudioExtensions.has(extension)) continue

    const path = join(folderPath, entry.name)
    let readOnly = false
    try {
      await access(path, constants.W_OK)
    } catch {
      readOnly = true
    }

    let metadata: LocalAudioFile['metadata'] = {}
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

  return { cancelled: false, folderPath, ignoredSymlinkCount, files }
}
