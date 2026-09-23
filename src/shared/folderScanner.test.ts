import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtemp, chmod, symlink, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scanFolder } from './folderScanner'

let workDir: string

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'trackalign-scan-'))
})

afterEach(async () => {
  await chmod(join(workDir, 'readonly.mp3'), 0o644).catch(() => undefined)
  await rm(workDir, { recursive: true, force: true })
})

describe('scanFolder', () => {
  it('includes only supported audio extensions', async () => {
    await writeFile(join(workDir, 'song.mp3'), 'x')
    await writeFile(join(workDir, 'track.flac'), 'x')
    await writeFile(join(workDir, 'notes.txt'), 'x')
    await writeFile(join(workDir, 'cover.png'), 'x')

    const result = await scanFolder(workDir)
    expect(result.files.map((file) => file.name).sort()).toEqual(['song.mp3', 'track.flac'])
  })

  it('flags dotfiles as hidden but still includes them', async () => {
    await writeFile(join(workDir, '.hidden.mp3'), 'x')

    const result = await scanFolder(workDir)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].hidden).toBe(true)
  })

  it('ignores symbolic links and reports how many were skipped', async () => {
    const realFile = join(workDir, 'real.mp3')
    await writeFile(realFile, 'x')
    await symlink(realFile, join(workDir, 'link.mp3'))

    const result = await scanFolder(workDir)
    expect(result.files.map((file) => file.name)).toEqual(['real.mp3'])
    expect(result.ignoredSymlinkCount).toBe(1)
  })

  it('flags read-only files without excluding them', async () => {
    const path = join(workDir, 'readonly.mp3')
    await writeFile(path, 'x')
    await chmod(path, 0o444)

    const result = await scanFolder(workDir)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].readOnly).toBe(true)
  })

  it('falls back to empty-looking metadata for unparseable audio content', async () => {
    await writeFile(join(workDir, 'not-really-audio.mp3'), 'this is not a valid mp3 file')

    const result = await scanFolder(workDir)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].metadata.title).toBeFalsy()
    expect(result.files[0].metadata.artist).toBeFalsy()
  })

  it('returns an empty file list for a folder with no supported audio', async () => {
    await writeFile(join(workDir, 'readme.md'), 'x')

    const result = await scanFolder(workDir)
    expect(result.files).toEqual([])
    expect(result.cancelled).toBe(false)
  })
})
