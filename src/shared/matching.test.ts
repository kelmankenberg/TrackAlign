import { describe, expect, it } from 'vitest'
import { matchFiles } from './matching'

describe('matching', () => {
  it('matches title and artist evidence one-to-one', () => {
    const proposals = matchFiles([
      { path: '/music/01.mp3', name: '01 - Artist - First.mp3', metadata: { title: 'First', artist: 'Artist', durationMs: 180000 } },
      { path: '/music/02.mp3', name: '02 - Artist - Second.mp3', metadata: { title: 'Second', artist: 'Artist', durationMs: 200000 } },
    ], [
      { position: 1, artist: 'Artist', title: 'First', duration: '3:00', durationMs: 180000 },
      { position: 2, artist: 'Artist', title: 'Second', duration: '3:20', durationMs: 200000 },
    ])

    expect(proposals.map((proposal) => proposal.trackPosition)).toEqual([1, 2])
    expect(proposals.every((proposal) => proposal.status === 'matched')).toBe(true)
  })

  it('leaves weak candidates unmatched', () => {
    const [proposal] = matchFiles([{ path: '/music/noise.mp3', name: 'noise.mp3', metadata: {} }], [{ position: 1, artist: 'Artist', title: 'Unrelated', duration: '3:00' }])
    expect(proposal.status).toBe('unmatched')
    expect(proposal.trackPosition).toBeNull()
  })

  it('keeps duplicate Spotify track occurrences distinct by position', () => {
    const proposals = matchFiles([
      { path: '/music/01.mp3', name: 'First.mp3', metadata: { title: 'First', artist: 'Artist' } },
      { path: '/music/02.mp3', name: 'First again.mp3', metadata: { title: 'First', artist: 'Artist' } },
    ], [
      { position: 1, artist: 'Artist', title: 'First', duration: '3:00' },
      { position: 2, artist: 'Artist', title: 'First', duration: '3:00' },
    ])

    expect(proposals.map((proposal) => proposal.trackPosition)).toEqual([1, 2])
  })
})
