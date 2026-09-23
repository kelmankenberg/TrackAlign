import { describe, expect, it } from 'vitest'
import { parseSpotifySource, describeSpotifyApiError, fetchSpotifyCollection, type FetchLike, type FetchResponseLike } from './spotify'

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): FetchResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  }
}

describe('parseSpotifySource', () => {
  it('extracts type and id from a playlist URL, ignoring query params', () => {
    expect(parseSpotifySource('https://open.spotify.com/playlist/abc123?si=xyz&utm_source=copy_link')).toEqual({ type: 'playlist', id: 'abc123' })
  })

  it('extracts type and id from an album URL', () => {
    expect(parseSpotifySource('https://open.spotify.com/album/def456')).toEqual({ type: 'album', id: 'def456' })
  })

  it('rejects unsupported URL shapes', () => {
    expect(() => parseSpotifySource('https://open.spotify.com/track/abc123')).toThrow()
    expect(() => parseSpotifySource('https://open.spotify.com/playlist/')).toThrow()
  })
})

describe('describeSpotifyApiError', () => {
  it('adds the algorithmic-playlist hint only for playlist 403s', () => {
    expect(describeSpotifyApiError(403, null, 'playlist')).toMatch(/algorithmic playlists/)
    expect(describeSpotifyApiError(403, null, 'album')).not.toMatch(/algorithmic playlists/)
  })

  it('includes the Retry-After hint for 429s', () => {
    expect(describeSpotifyApiError(429, null, 'playlist', 12)).toMatch(/try again in about 12 seconds/)
  })

  it('surfaces the Spotify error message when present', () => {
    expect(describeSpotifyApiError(401, { error: { message: 'Invalid access token' } }, 'album')).toMatch(/Invalid access token/)
  })
})

describe('fetchSpotifyCollection', () => {
  it('preserves duplicate track occurrences by playlist position', async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes('/playlists/p1?fields=name')) return jsonResponse(200, { name: 'My Mix' })
      return jsonResponse(200, {
        items: [
          { track: { name: 'Song', duration_ms: 180000, artists: [{ name: 'Artist' }] } },
          { track: { name: 'Song', duration_ms: 180000, artists: [{ name: 'Artist' }] } },
        ],
        next: null,
      })
    }

    const collection = await fetchSpotifyCollection('https://open.spotify.com/playlist/p1', 'token', fetchImpl)
    expect(collection.name).toBe('My Mix')
    expect(collection.tracks.map((track) => track.position)).toEqual([1, 2])
  })

  it('follows pagination via next until exhausted', async () => {
    let call = 0
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes('fields=name')) return jsonResponse(200, { name: 'Paged' })
      call += 1
      if (call === 1) {
        return jsonResponse(200, { items: [{ track: { name: 'One', duration_ms: 60000, artists: [{ name: 'A' }] } }], next: 'page-2' })
      }
      return jsonResponse(200, { items: [{ track: { name: 'Two', duration_ms: 60000, artists: [{ name: 'A' }] } }], next: null })
    }

    const collection = await fetchSpotifyCollection('https://open.spotify.com/playlist/p2', 'token', fetchImpl)
    expect(collection.tracks.map((track) => track.title)).toEqual(['One', 'Two'])
    expect(collection.tracks.map((track) => track.position)).toEqual([1, 2])
  })

  it('uses album metadata for every track when loading an album', async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.endsWith('/albums/a1')) return jsonResponse(200, { name: 'Great Album', release_date: '2019-05-01' })
      return jsonResponse(200, { items: [{ name: 'Track One', duration_ms: 200000, artists: [{ name: 'Artist' }] }], next: null })
    }

    const collection = await fetchSpotifyCollection('https://open.spotify.com/album/a1', 'token', fetchImpl)
    expect(collection.name).toBe('Great Album')
    expect(collection.tracks[0].album).toBe('Great Album')
    expect(collection.tracks[0].year).toBe(2019)
  })

  it('throws a descriptive error including the algorithmic-playlist hint on 403', async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes('fields=name')) return jsonResponse(200, { name: 'Discover Weekly' })
      return jsonResponse(403, { error: { message: 'Forbidden' } })
    }

    await expect(fetchSpotifyCollection('https://open.spotify.com/playlist/dw', 'token', fetchImpl)).rejects.toThrow(/algorithmic playlists/)
  })

  it('gives a distinct message when the network itself is unreachable', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError('fetch failed')
    }

    await expect(fetchSpotifyCollection('https://open.spotify.com/playlist/offline', 'token', fetchImpl)).rejects.toThrow(/internet connection/)
  })
})
