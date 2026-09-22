export interface MatchingLocalFile {
  path: string
  name: string
  metadata: {
    title?: string
    artist?: string
    durationMs?: number | null
  }
}

export interface MatchingTrack {
  position: number
  artist: string
  title: string
  duration: string
  durationMs?: number
}

export interface MatchProposal {
  filePath: string
  fileName: string
  trackPosition: number | null
  trackTitle: string
  trackArtist: string
  score: number
  status: 'matched' | 'review' | 'unmatched'
  evidence: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\.(mp3|flac|ogg|m4a)$/i, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\b(feat\.?|ft\.?)\b/g, ' featuring ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function similarity(left: string, right: string) {
  const leftTokens = new Set(normalize(left).split(' ').filter(Boolean))
  const rightTokens = new Set(normalize(right).split(' ').filter(Boolean))
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return (2 * overlap) / (leftTokens.size + rightTokens.size)
}

function durationSimilarity(localDurationMs: number | null | undefined, trackDurationMs: number | undefined) {
  if (!localDurationMs || !trackDurationMs) return 0
  const difference = Math.abs(localDurationMs - trackDurationMs)
  return Math.max(0, 1 - difference / 15_000)
}

export function matchFiles(files: MatchingLocalFile[], tracks: MatchingTrack[]) {
  const assignedPositions = new Set<number>()
  const proposals: MatchProposal[] = []

  for (const file of files) {
    const fileTitle = file.metadata.title || file.name
    const fileArtist = file.metadata.artist || ''
    const candidates = tracks
      .filter((track) => !assignedPositions.has(track.position))
      .map((track) => {
        const titleScore = Math.max(similarity(fileTitle, track.title), similarity(file.name, track.title))
        const artistScore = similarity(fileArtist, track.artist)
        const durationScore = durationSimilarity(file.metadata.durationMs, track.durationMs)
        const score = titleScore * 0.55 + artistScore * 0.3 + durationScore * 0.15
        const evidence = [titleScore > 0.7 ? 'title' : titleScore > 0.35 ? 'filename' : '', artistScore > 0.55 ? 'artist' : '', durationScore > 0.75 ? 'duration' : ''].filter(Boolean)
        return { track, score, evidence }
      })
      .sort((left, right) => right.score - left.score)
    const best = candidates[0]

    if (!best || best.score < 0.28) {
      proposals.push({ filePath: file.path, fileName: file.name, trackPosition: null, trackTitle: '', trackArtist: '', score: best?.score ?? 0, status: 'unmatched', evidence: [] })
      continue
    }

    assignedPositions.add(best.track.position)
    proposals.push({ filePath: file.path, fileName: file.name, trackPosition: best.track.position, trackTitle: best.track.title, trackArtist: best.track.artist, score: best.score, status: best.score >= 0.68 ? 'matched' : 'review', evidence: best.evidence })
  }

  return proposals
}
