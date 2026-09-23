import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyRenames, undoLatestRename, ensureSafeTargetName } from './renameService'

let workDir: string
let historyFilePath: string

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'trackalign-rename-'))
  historyFilePath = join(workDir, 'history.json')
})

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true })
})

async function createFile(name: string, contents = 'x') {
  const path = join(workDir, name)
  await writeFile(path, contents, 'utf8')
  return path
}

describe('renameService', () => {
  it('renames a file to the target name', async () => {
    const source = await createFile('01.mp3')
    await applyRenames([{ sourcePath: source, targetName: '01 - Artist - Title.mp3' }], historyFilePath)

    await expect(stat(source)).rejects.toThrow()
    await expect(stat(join(workDir, '01 - Artist - Title.mp3'))).resolves.toBeTruthy()
  })

  it('never overwrites an existing file and adds a collision suffix', async () => {
    const source = await createFile('02.mp3')
    await createFile('Existing.mp3', 'do-not-overwrite')

    await applyRenames([{ sourcePath: source, targetName: 'Existing.mp3' }], historyFilePath)

    const untouched = await readFile(join(workDir, 'Existing.mp3'), 'utf8')
    expect(untouched).toBe('do-not-overwrite')
    await expect(stat(join(workDir, 'Existing (1).mp3'))).resolves.toBeTruthy()
  })

  it('swaps two filenames safely using staged temporary renames', async () => {
    const fileA = await createFile('A.mp3', 'contents-a')
    const fileB = await createFile('B.mp3', 'contents-b')

    await applyRenames([
      { sourcePath: fileA, targetName: 'B.mp3' },
      { sourcePath: fileB, targetName: 'A.mp3' },
    ], historyFilePath)

    expect(await readFile(join(workDir, 'A.mp3'), 'utf8')).toBe('contents-b')
    expect(await readFile(join(workDir, 'B.mp3'), 'utf8')).toBe('contents-a')
  })

  it('is a no-op when the target name matches the current filename', async () => {
    const source = await createFile('Same.mp3')
    const manifest = await applyRenames([{ sourcePath: source, targetName: 'Same.mp3' }], historyFilePath)

    expect(manifest.items).toHaveLength(0)
    await expect(stat(source)).resolves.toBeTruthy()
  })

  it('rejects invalid target filenames', async () => {
    const source = await createFile('Invalid.mp3')
    await expect(applyRenames([{ sourcePath: source, targetName: '../escape.mp3' }], historyFilePath)).rejects.toThrow()
  })

  it('persists a manifest and undoes the most recent rename', async () => {
    const source = await createFile('03.mp3')
    await applyRenames([{ sourcePath: source, targetName: 'Renamed.mp3' }], historyFilePath)

    const historyRaw = await readFile(historyFilePath, 'utf8')
    expect(JSON.parse(historyRaw)).toHaveLength(1)

    const result = await undoLatestRename(historyFilePath)
    expect(result.undone).toBe(true)
    await expect(stat(source)).resolves.toBeTruthy()
    await expect(stat(join(workDir, 'Renamed.mp3'))).rejects.toThrow()
  })

  it('refuses to undo when the renamed file has since changed', async () => {
    const source = await createFile('04.mp3')
    await applyRenames([{ sourcePath: source, targetName: 'Changed.mp3' }], historyFilePath)

    const renamedPath = join(workDir, 'Changed.mp3')
    await rm(renamedPath)
    await mkdir(join(workDir, 'placeholder'))
    await writeFile(source, 'a-new-file-appeared-at-the-original-path', 'utf8')

    await expect(undoLatestRename(historyFilePath)).rejects.toThrow(/changed since/)
  })

  it('reports there is nothing to undo when history is empty', async () => {
    await expect(undoLatestRename(historyFilePath)).rejects.toThrow(/no rename operation/)
  })

  it('validates safe target names directly', () => {
    expect(() => ensureSafeTargetName('Normal Name.mp3')).not.toThrow()
    expect(() => ensureSafeTargetName('')).toThrow()
    expect(() => ensureSafeTargetName('..')).toThrow()
    expect(() => ensureSafeTargetName('sub/dir.mp3')).toThrow()
  })
})
