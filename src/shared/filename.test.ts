import { describe, expect, it } from 'vitest'
import { renderFilename, sanitizeFilename } from './filename'

describe('filename rendering', () => {
  it('renders tokens and preserves the source extension', () => {
    expect(renderFilename('{trackNumber} - {artist} - {title}', { trackNumber: 2, artist: 'Artist', title: 'Title' }, '.MP3')).toBe('02 - Artist - Title.mp3')
  })

  it('omits missing fields and removes invalid characters', () => {
    expect(renderFilename('{trackNumber} - {artist} - {album} - {title}', { trackNumber: 1, artist: 'A/B', title: 'Song?' }, '.flac')).toBe('01 - AB - Song.flac')
    expect(sanitizeFilename(' name:with*invalid? ')).toBe('namewithinvalid')
  })
})
