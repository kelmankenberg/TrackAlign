import { describe, expect, it } from 'vitest'
import {
  requestDeviceCode,
  pollDeviceAuthorization,
  describeGithubApiError,
  createIssue,
  listDiscussionCategories,
  listDiscussions,
  getDiscussion,
  createDiscussion,
  addDiscussionComment,
  type GithubFetchLike,
  type GithubFetchResponse,
} from './github'

function jsonResponse(status: number, body: unknown): GithubFetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  }
}

describe('describeGithubApiError', () => {
  it('adds a reconnect hint for 401s', () => {
    expect(describeGithubApiError(401, null)).toMatch(/Reconnect from Settings/)
  })

  it('surfaces the GitHub error message when present', () => {
    expect(describeGithubApiError(422, { message: 'Validation failed' })).toMatch(/Validation failed/)
  })
})

describe('requestDeviceCode', () => {
  it('parses a successful device code response', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, {
      device_code: 'dev123', user_code: 'ABCD-1234', verification_uri: 'https://github.com/login/device', verification_uri_complete: 'https://github.com/login/device?user_code=ABCD-1234', expires_in: 900, interval: 5,
    })
    const result = await requestDeviceCode('client1', 'public_repo', fetchImpl)
    expect(result).toEqual({
      deviceCode: 'dev123', userCode: 'ABCD-1234', verificationUri: 'https://github.com/login/device', verificationUriComplete: 'https://github.com/login/device?user_code=ABCD-1234', expiresInSeconds: 900, intervalSeconds: 5,
    })
  })

  it('throws when the response is missing required fields', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(400, { message: 'bad request' })
    await expect(requestDeviceCode('client1', 'public_repo', fetchImpl)).rejects.toThrow(/bad request/)
  })
})

describe('pollDeviceAuthorization', () => {
  it('returns an access token on success', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { access_token: 'tok123' })
    await expect(pollDeviceAuthorization('client1', 'dev123', fetchImpl)).resolves.toEqual({ accessToken: 'tok123' })
  })

  it('returns the pending error while the user has not authorized yet', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { error: 'authorization_pending' })
    await expect(pollDeviceAuthorization('client1', 'dev123', fetchImpl)).resolves.toEqual({ error: 'authorization_pending', intervalSeconds: undefined })
  })

  it('returns slow_down with an updated interval', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { error: 'slow_down', interval: 10 })
    await expect(pollDeviceAuthorization('client1', 'dev123', fetchImpl)).resolves.toEqual({ error: 'slow_down', intervalSeconds: 10 })
  })
})

describe('createIssue', () => {
  it('returns the created issue number and URL', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(201, { number: 42, html_url: 'https://github.com/kelmankenberg/TrackAlign/issues/42' })
    await expect(createIssue('kelmankenberg', 'TrackAlign', 'Bug', 'Details', 'tok', fetchImpl)).resolves.toEqual({ number: 42, htmlUrl: 'https://github.com/kelmankenberg/TrackAlign/issues/42' })
  })

  it('throws a descriptive error on failure', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(403, { message: 'Forbidden' })
    await expect(createIssue('kelmankenberg', 'TrackAlign', 'Bug', 'Details', 'tok', fetchImpl)).rejects.toThrow(/Forbidden/)
  })
})

describe('discussion GraphQL helpers', () => {
  it('lists discussion categories', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { data: { repository: { discussionCategories: { nodes: [{ id: 'c1', name: 'Ideas', emoji: '💡' }] } } } })
    await expect(listDiscussionCategories('kelmankenberg', 'TrackAlign', 'tok', fetchImpl)).resolves.toEqual([{ id: 'c1', name: 'Ideas', emoji: '💡' }])
  })

  it('lists discussions with pagination info', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, {
      data: {
        repository: {
          discussions: {
            nodes: [{ id: 'd1', number: 1, title: 'Hello', createdAt: '2026-01-01T00:00:00Z', author: { login: 'octocat' }, comments: { totalCount: 3 } }],
            pageInfo: { hasNextPage: true, endCursor: 'cursor1' },
          },
        },
      },
    })
    await expect(listDiscussions('kelmankenberg', 'TrackAlign', 'tok', fetchImpl)).resolves.toEqual({
      discussions: [{ id: 'd1', number: 1, title: 'Hello', createdAt: '2026-01-01T00:00:00Z', authorLogin: 'octocat', commentCount: 3 }],
      hasNextPage: true,
      endCursor: 'cursor1',
    })
  })

  it('gets a discussion with its comments', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, {
      data: {
        repository: {
          discussion: {
            id: 'd1', number: 1, title: 'Hello', bodyHTML: '<p>Hi</p>', createdAt: '2026-01-01T00:00:00Z', author: { login: 'octocat', avatarUrl: 'https://example.com/a.png' },
            comments: { nodes: [{ id: 'cm1', bodyHTML: '<p>Reply</p>', createdAt: '2026-01-02T00:00:00Z', author: { login: 'other' } }] },
          },
        },
      },
    })
    await expect(getDiscussion('kelmankenberg', 'TrackAlign', 1, 'tok', fetchImpl)).resolves.toEqual({
      id: 'd1', number: 1, title: 'Hello', bodyHTML: '<p>Hi</p>', createdAt: '2026-01-01T00:00:00Z', authorLogin: 'octocat', authorAvatarUrl: 'https://example.com/a.png',
      comments: [{ id: 'cm1', bodyHTML: '<p>Reply</p>', createdAt: '2026-01-02T00:00:00Z', authorLogin: 'other', authorAvatarUrl: undefined }],
    })
  })

  it('throws when a discussion is not found', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { data: { repository: { discussion: null } } })
    await expect(getDiscussion('kelmankenberg', 'TrackAlign', 999, 'tok', fetchImpl)).rejects.toThrow(/could not be found/)
  })

  it('creates a discussion by first resolving the repository id', async () => {
    let call = 0
    const fetchImpl: GithubFetchLike = async () => {
      call += 1
      if (call === 1) return jsonResponse(200, { data: { repository: { id: 'repo1' } } })
      return jsonResponse(200, { data: { createDiscussion: { discussion: { id: 'd2', number: 5, url: 'https://github.com/kelmankenberg/TrackAlign/discussions/5' } } } })
    }
    await expect(createDiscussion('kelmankenberg', 'TrackAlign', 'cat1', 'Idea', 'Body', 'tok', fetchImpl)).resolves.toEqual({ id: 'd2', number: 5, url: 'https://github.com/kelmankenberg/TrackAlign/discussions/5' })
  })

  it('adds a discussion comment', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { data: { addDiscussionComment: { comment: { id: 'cm2' } } } })
    await expect(addDiscussionComment('d1', 'Reply text', 'tok', fetchImpl)).resolves.toEqual({ id: 'cm2' })
  })

  it('throws when the GraphQL response contains errors', async () => {
    const fetchImpl: GithubFetchLike = async () => jsonResponse(200, { errors: [{ message: 'Could not resolve to a Repository' }] })
    await expect(listDiscussionCategories('kelmankenberg', 'TrackAlign', 'tok', fetchImpl)).rejects.toThrow(/Could not resolve to a Repository/)
  })
})
