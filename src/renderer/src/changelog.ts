export interface ChangelogEntry {
  version: string
  date: string
  notes: string[]
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  let current: ChangelogEntry | null = null

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim()
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      current = { version: heading[1].trim(), date: '', notes: [] }
      entries.push(current)
      continue
    }
    if (!current) continue

    const date = line.match(/^\*\*(?:Date|Released|Status):\*\*\s*(.+)$/i)
    if (date) {
      current.date = date[1].trim()
      continue
    }

    const note = line.match(/^[-*]\s+(.+)$/)
    if (note) current.notes.push(note[1].trim())
  }

  return entries.filter((entry) => entry.notes.length > 0)
}
