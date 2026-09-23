import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'

export interface RenameItem {
  sourcePath: string
  targetName: string
}

export interface RenameManifest {
  id: string
  createdAt: string
  items: Array<{ originalPath: string; newPath: string }>
}

export async function pathExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export function ensureSafeTargetName(targetName: string) {
  if (!targetName || targetName === '.' || targetName === '..' || targetName.includes('/') || targetName.includes('\\')) throw new Error('A rename target contains an invalid filename.')
}

export async function readRenameHistory(historyFilePath: string): Promise<RenameManifest[]> {
  try {
    return JSON.parse(await readFile(historyFilePath, 'utf8')) as RenameManifest[]
  } catch {
    return []
  }
}

export async function writeRenameHistory(historyFilePath: string, history: RenameManifest[]) {
  await mkdir(dirname(historyFilePath), { recursive: true })
  await writeFile(historyFilePath, JSON.stringify(history.slice(-20), null, 2), 'utf8')
}

export async function applyRenames(items: RenameItem[], historyFilePath: string) {
  if (!items.length) throw new Error('Select at least one matched file before renaming.')
  const sourcePaths = new Set(items.map((item) => item.sourcePath))
  const reserved = new Set<string>()
  const resolved: Array<{ sourcePath: string; targetPath: string }> = []

  for (const item of items) {
    ensureSafeTargetName(item.targetName)
    const sourceInfo = await stat(item.sourcePath)
    if (!sourceInfo.isFile()) throw new Error(`Source is not a regular file: ${basename(item.sourcePath)}`)
    const directory = dirname(item.sourcePath)
    const extension = extname(item.targetName) || extname(item.sourcePath)
    const stem = basename(item.targetName, extname(item.targetName))
    let targetPath = join(directory, item.targetName)
    let suffix = 1
    while (reserved.has(targetPath) || (await pathExists(targetPath) && targetPath !== item.sourcePath && !sourcePaths.has(targetPath))) {
      targetPath = join(directory, `${stem} (${suffix})${extension}`)
      suffix += 1
    }
    reserved.add(targetPath)
    if (targetPath !== item.sourcePath) resolved.push({ sourcePath: item.sourcePath, targetPath })
  }

  const staged: Array<{ temporaryPath: string; targetPath: string; sourcePath: string }> = []
  try {
    for (const item of resolved) {
      const temporaryPath = `${item.sourcePath}.trackalign-${randomBytes(8).toString('hex')}.tmp`
      await rename(item.sourcePath, temporaryPath)
      staged.push({ temporaryPath, targetPath: item.targetPath, sourcePath: item.sourcePath })
    }
    for (const item of staged) await rename(item.temporaryPath, item.targetPath)
  } catch (error) {
    for (const item of staged) {
      if (await pathExists(item.temporaryPath)) await rename(item.temporaryPath, item.sourcePath).catch(() => undefined)
    }
    throw error
  }

  const manifest: RenameManifest = { id: randomBytes(10).toString('hex'), createdAt: new Date().toISOString(), items: staged.map((item) => ({ originalPath: item.sourcePath, newPath: item.targetPath })) }
  const history = await readRenameHistory(historyFilePath)
  history.push(manifest)
  await writeRenameHistory(historyFilePath, history)
  return manifest
}

export async function undoLatestRename(historyFilePath: string) {
  const history = await readRenameHistory(historyFilePath)
  const manifest = history.at(-1)
  if (!manifest) throw new Error('There is no rename operation to undo.')
  for (const item of manifest.items) {
    if (!(await pathExists(item.newPath)) || await pathExists(item.originalPath)) throw new Error('Undo stopped because a file has changed since the rename operation.')
  }
  for (const item of manifest.items) await rename(item.newPath, item.originalPath)
  await writeRenameHistory(historyFilePath, history.slice(0, -1))
  return { undone: true, id: manifest.id }
}
