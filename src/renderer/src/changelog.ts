export interface ChangelogSection {
  title: string
  notes: string[]
}

export interface ChangelogEntry {
  version: string
  sections: ChangelogSection[]
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  let current: ChangelogEntry | null = null
  let currentSection: ChangelogSection | null = null

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim()
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      current = { version: heading[1].trim(), sections: [] }
      currentSection = null
      entries.push(current)
      continue
    }
    if (!current) continue

    const sectionHeading = line.match(/^###\s+(.+)$/)
    if (sectionHeading) {
      currentSection = { title: sectionHeading[1].trim(), notes: [] }
      current.sections.push(currentSection)
      continue
    }

    const note = line.match(/^[-*]\s+(.+)$/)
    if (note) {
      if (!currentSection) {
        currentSection = { title: 'Changes', notes: [] }
        current.sections.push(currentSection)
      }
      currentSection.notes.push(note[1].trim())
    }
  }

  return entries
    .map((entry) => ({ ...entry, sections: entry.sections.filter((section) => section.notes.length > 0) }))
    .filter((entry) => entry.sections.length > 0)
}
