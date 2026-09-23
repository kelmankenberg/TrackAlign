export type SpotifySourceType = 'playlist' | 'album'

export interface SpotifySource {
  type: SpotifySourceType
  id: string
}

export interface SpotifyCollectionTrack {
  position: number
  artist: string
  title: string
  album: string
  year: number | null
  duration: string
  durationMs: number
}

export interface SpotifyCollection {
  type: SpotifySourceType
  name: string
  url: string
  tracks: SpotifyCollectionTrack[]
}

export interface FetchResponseLike {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  json: () => Promise<unknown>
}

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<FetchResponseLike>

export function parseSpotifySource(sourceUrl: string): SpotifySource {
  const parsed = new URL(sourceUrl)
  const segments = parsed.pathname.split('/').filter(Boolean)
  const type = segments[0]
  if ((type !== 'playlist' && type !== 'album') || !segments[1]) throw new Error('Enter a Spotify playlist or album URL.')
  return { type, id: segments[1] }
}

export function describeSpotifyApiError(status: number, body: { error?: { message?: string } } | null, sourceType: SpotifySourceType, retryAfterSeconds?: number) {
  const reason = body?.error?.message ? ` ${body.error.message}` : ''
  const hint = status === 403 && sourceType === 'playlist' ? ' Spotify blocks third-party access to algorithmic playlists (Discover Weekly, Daily Mix, Release Radar, Blend, Made For You). Try a playlist you created yourself.' : ''
  const rateLimitHint = status === 429 ? ` Spotify is rate-limiting requests${retryAfterSeconds ? `; try again in about ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'}` : ''}.` : ''
  return `Spotify could not load this ${sourceType} (${status}).${reason}${hint}${rateLimitHint}`
}

interface RawSpotifyTrack {
  name: string
  duration_ms: number
  artists: Array<{ name: string }>
  album?: { name: string; release_date?: string }
}

export async function fetchSpotifyCollection(sourceUrl: string, accessToken: string, fetchImpl: FetchLike, apiBase = 'https://api.spotify.com/v1'): Promise<SpotifyCollection> {
  const source = parseSpotifySource(sourceUrl)
  let endpoint: string | null = source.type === 'playlist' ? `${apiBase}/playlists/${source.id}/tracks?limit=50` : `${apiBase}/albums/${source.id}/tracks?limit=50`
  const sourceTracks: RawSpotifyTrack[] = []

  let collectionName = source.type === 'playlist' ? 'Spotify playlist' : 'Spotify album'
  let albumName = ''
  let albumYear: number | null = null
  const metaEndpoint = source.type === 'album' ? `${apiBase}/albums/${source.id}` : `${apiBase}/playlists/${source.id}?fields=name`
  const metaResponse = await fetchImpl(metaEndpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (metaResponse.ok) {
    const metaPayload = await metaResponse.json() as { name?: string; release_date?: string }
    if (metaPayload.name) collectionName = metaPayload.name
    if (source.type === 'album') {
      albumName = metaPayload.name ?? ''
      albumYear = metaPayload.release_date ? Number(metaPayload.release_date.slice(0, 4)) || null : null
    }
  }

  while (endpoint) {
    const response = await fetchImpl(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
      const retryAfterHeader = response.headers.get('Retry-After')
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined
      throw new Error(describeSpotifyApiError(response.status, body, source.type, retryAfterSeconds))
    }
    const payload = await response.json() as { items: Array<{ track?: RawSpotifyTrack } & RawSpotifyTrack>; next?: string | null }
    sourceTracks.push(...payload.items.map((item) => source.type === 'playlist' ? item.track : item).filter((track): track is RawSpotifyTrack => Boolean(track)))
    endpoint = payload.next ?? null
  }

  const tracks: SpotifyCollectionTrack[] = sourceTracks.map((track, index) => ({
    position: index + 1,
    artist: track.artists.map((artist) => artist.name).join(', '),
    title: track.name,
    album: source.type === 'album' ? albumName : track.album?.name ?? '',
    year: source.type === 'album' ? albumYear : (track.album?.release_date ? Number(track.album.release_date.slice(0, 4)) || null : null),
    duration: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor(track.duration_ms / 1000) % 60).padStart(2, '0')}`,
    durationMs: track.duration_ms,
  }))
  return { type: source.type, name: collectionName, url: sourceUrl, tracks }
}
