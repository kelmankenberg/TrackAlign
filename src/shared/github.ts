export interface GithubFetchResponse {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  json: () => Promise<unknown>
}

export type GithubFetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<GithubFetchResponse>

export interface GithubDeviceCodeResponse {
  deviceCode: string
  userCode: string
  verificationUri: string
  verificationUriComplete?: string
  expiresInSeconds: number
  intervalSeconds: number
}

export interface GithubTokenResult {
  accessToken?: string
  error?: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | string
  intervalSeconds?: number
}

export interface GithubIssueResult {
  number: number
  htmlUrl: string
}

export interface GithubDiscussionCategory {
  id: string
  name: string
  emoji: string
}

export interface GithubDiscussionSummary {
  id: string
  number: number
  title: string
  createdAt: string
  authorLogin: string
  commentCount: number
}

export interface GithubDiscussionComment {
  id: string
  bodyHTML: string
  createdAt: string
  authorLogin: string
  authorAvatarUrl?: string
}

export interface GithubDiscussionDetail {
  id: string
  number: number
  title: string
  bodyHTML: string
  createdAt: string
  authorLogin: string
  authorAvatarUrl?: string
  comments: GithubDiscussionComment[]
}

export interface GithubDiscussionPage {
  discussions: GithubDiscussionSummary[]
  hasNextPage: boolean
  endCursor: string | null
}

async function parseJson(response: GithubFetchResponse) {
  return response.json().catch(() => null)
}

export function describeGithubApiError(status: number, body: { message?: string } | null) {
  const reason = body?.message ? ` ${body.message}` : ''
  const hint = status === 401 ? ' Your GitHub connection has expired. Reconnect from Settings.'
    : status === 403 ? ' GitHub is rate-limiting requests or the connection lacks the required permissions.'
    : status === 404 ? ' The repository, issue, or discussion could not be found.'
    : ''
  return `GitHub could not complete this request (${status}).${reason}${hint}`
}

export async function requestDeviceCode(clientId: string, scope: string, fetchImpl: GithubFetchLike): Promise<GithubDeviceCodeResponse> {
  let response: GithubFetchResponse
  try {
    response = await fetchImpl('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ client_id: clientId, scope }).toString(),
    })
  } catch (cause) {
    throw new Error('Could not reach GitHub. Check your internet connection and try again.', { cause })
  }
  const body = await parseJson(response) as { device_code?: string; user_code?: string; verification_uri?: string; verification_uri_complete?: string; expires_in?: number; interval?: number; message?: string } | null
  if (!response.ok || !body?.device_code || !body.user_code || !body.verification_uri) {
    throw new Error(describeGithubApiError(response.status, body))
  }
  return {
    deviceCode: body.device_code,
    userCode: body.user_code,
    verificationUri: body.verification_uri,
    verificationUriComplete: body.verification_uri_complete,
    expiresInSeconds: body.expires_in ?? 900,
    intervalSeconds: body.interval ?? 5,
  }
}

export async function pollDeviceAuthorization(clientId: string, deviceCode: string, fetchImpl: GithubFetchLike): Promise<GithubTokenResult> {
  let response: GithubFetchResponse
  try {
    response = await fetchImpl('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }).toString(),
    })
  } catch (cause) {
    throw new Error('Could not reach GitHub. Check your internet connection and try again.', { cause })
  }
  const body = await parseJson(response) as { access_token?: string; error?: string; interval?: number } | null
  if (body?.access_token) return { accessToken: body.access_token }
  if (body?.error) return { error: body.error, intervalSeconds: body.interval }
  throw new Error(describeGithubApiError(response.status, body as { message?: string } | null))
}

export async function createIssue(owner: string, repo: string, title: string, body: string, accessToken: string, fetchImpl: GithubFetchLike): Promise<GithubIssueResult> {
  let response: GithubFetchResponse
  try {
    response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body }),
    })
  } catch (cause) {
    throw new Error('Could not reach GitHub. Check your internet connection and try again.', { cause })
  }
  const payload = await parseJson(response) as { number?: number; html_url?: string; message?: string } | null
  if (!response.ok || typeof payload?.number !== 'number' || !payload.html_url) {
    throw new Error(describeGithubApiError(response.status, payload))
  }
  return { number: payload.number, htmlUrl: payload.html_url }
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>, accessToken: string, fetchImpl: GithubFetchLike): Promise<T> {
  let response: GithubFetchResponse
  try {
    response = await fetchImpl('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch (cause) {
    throw new Error('Could not reach GitHub. Check your internet connection and try again.', { cause })
  }
  const payload = await parseJson(response) as { data?: T; errors?: Array<{ message: string }>; message?: string } | null
  if (!response.ok) throw new Error(describeGithubApiError(response.status, payload))
  if (payload?.errors?.length) throw new Error(`GitHub Discussions error: ${payload.errors.map((error) => error.message).join('; ')}`)
  if (!payload?.data) throw new Error('GitHub Discussions returned an empty response.')
  return payload.data
}

async function getRepositoryId(owner: string, repo: string, accessToken: string, fetchImpl: GithubFetchLike): Promise<string> {
  const data = await graphqlRequest<{ repository: { id: string } | null }>(
    'query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){ id } }',
    { owner, repo },
    accessToken,
    fetchImpl,
  )
  if (!data.repository) throw new Error('The repository could not be found.')
  return data.repository.id
}

export async function listDiscussionCategories(owner: string, repo: string, accessToken: string, fetchImpl: GithubFetchLike): Promise<GithubDiscussionCategory[]> {
  const data = await graphqlRequest<{ repository: { discussionCategories: { nodes: GithubDiscussionCategory[] } } | null }>(
    'query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){ discussionCategories(first:25){ nodes{ id name emoji } } } }',
    { owner, repo },
    accessToken,
    fetchImpl,
  )
  return data.repository?.discussionCategories.nodes ?? []
}

interface RawDiscussionNode {
  id: string
  number: number
  title: string
  createdAt: string
  author: { login: string } | null
  comments: { totalCount: number }
}

export async function listDiscussions(owner: string, repo: string, accessToken: string, fetchImpl: GithubFetchLike, options: { categoryId?: string; after?: string } = {}): Promise<GithubDiscussionPage> {
  const data = await graphqlRequest<{ repository: { discussions: { nodes: RawDiscussionNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null }>(
    'query($owner:String!,$repo:String!,$categoryId:ID,$after:String){ repository(owner:$owner,name:$repo){ discussions(first:20, after:$after, categoryId:$categoryId){ nodes{ id number title createdAt author{ login } comments{ totalCount } } pageInfo{ hasNextPage endCursor } } } }',
    { owner, repo, categoryId: options.categoryId ?? null, after: options.after ?? null },
    accessToken,
    fetchImpl,
  )
  const discussions = data.repository?.discussions.nodes.map((node) => ({
    id: node.id,
    number: node.number,
    title: node.title,
    createdAt: node.createdAt,
    authorLogin: node.author?.login ?? 'ghost',
    commentCount: node.comments.totalCount,
  })) ?? []
  return {
    discussions,
    hasNextPage: data.repository?.discussions.pageInfo.hasNextPage ?? false,
    endCursor: data.repository?.discussions.pageInfo.endCursor ?? null,
  }
}

interface RawCommentNode {
  id: string
  bodyHTML: string
  createdAt: string
  author: { login: string; avatarUrl?: string } | null
}

export async function getDiscussion(owner: string, repo: string, number: number, accessToken: string, fetchImpl: GithubFetchLike): Promise<GithubDiscussionDetail> {
  const data = await graphqlRequest<{ repository: { discussion: {
    id: string
    number: number
    title: string
    bodyHTML: string
    createdAt: string
    author: { login: string; avatarUrl?: string } | null
    comments: { nodes: RawCommentNode[] }
  } | null } | null }>(
    'query($owner:String!,$repo:String!,$number:Int!){ repository(owner:$owner,name:$repo){ discussion(number:$number){ id number title bodyHTML createdAt author{ login avatarUrl } comments(first:50){ nodes{ id bodyHTML createdAt author{ login avatarUrl } } } } } }',
    { owner, repo, number },
    accessToken,
    fetchImpl,
  )
  const discussion = data.repository?.discussion
  if (!discussion) throw new Error('This discussion could not be found.')
  return {
    id: discussion.id,
    number: discussion.number,
    title: discussion.title,
    bodyHTML: discussion.bodyHTML,
    createdAt: discussion.createdAt,
    authorLogin: discussion.author?.login ?? 'ghost',
    authorAvatarUrl: discussion.author?.avatarUrl,
    comments: discussion.comments.nodes.map((node) => ({
      id: node.id,
      bodyHTML: node.bodyHTML,
      createdAt: node.createdAt,
      authorLogin: node.author?.login ?? 'ghost',
      authorAvatarUrl: node.author?.avatarUrl,
    })),
  }
}

export async function createDiscussion(owner: string, repo: string, categoryId: string, title: string, body: string, accessToken: string, fetchImpl: GithubFetchLike): Promise<{ id: string; number: number; url: string }> {
  const repositoryId = await getRepositoryId(owner, repo, accessToken, fetchImpl)
  const data = await graphqlRequest<{ createDiscussion: { discussion: { id: string; number: number; url: string } } }>(
    'mutation($repositoryId:ID!,$categoryId:ID!,$title:String!,$body:String!){ createDiscussion(input:{repositoryId:$repositoryId, categoryId:$categoryId, title:$title, body:$body}){ discussion{ id number url } } }',
    { repositoryId, categoryId, title, body },
    accessToken,
    fetchImpl,
  )
  return data.createDiscussion.discussion
}

export async function addDiscussionComment(discussionId: string, body: string, accessToken: string, fetchImpl: GithubFetchLike): Promise<{ id: string }> {
  const data = await graphqlRequest<{ addDiscussionComment: { comment: { id: string } } }>(
    'mutation($discussionId:ID!,$body:String!){ addDiscussionComment(input:{discussionId:$discussionId, body:$body}){ comment{ id } } }',
    { discussionId, body },
    accessToken,
    fetchImpl,
  )
  return data.addDiscussionComment.comment
}
