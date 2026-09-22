export interface FilenameValues {
  trackNumber?: number | null
  artist?: string
  album?: string
  title?: string
  year?: number | null
}

const invalidCharacters = /[<>:"/\\|?*\u0000-\u001f]/g

export function sanitizeFilename(value: string) {
  return value
    .replace(invalidCharacters, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim()
}

export function renderFilename(template: string, values: FilenameValues, extension: string) {
  const rendered = template.replace(/\{(trackNumber|artist|album|title|year)\}/g, (_token, key: keyof FilenameValues) => {
    const value = values[key]
    if (value === null || value === undefined || value === '') return ''
    if (key === 'trackNumber') return String(value).padStart(2, '0')
    return String(value)
  })
  const cleanedParts = rendered.split(/\s+-\s+|\s*[-|]\s*/).map((part) => sanitizeFilename(part)).filter(Boolean)
  const name = sanitizeFilename(cleanedParts.join(' - ')) || 'untitled'
  return `${name}${extension.toLowerCase()}`
}
