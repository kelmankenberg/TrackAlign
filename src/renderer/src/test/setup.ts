import { afterEach, vi } from 'vitest'

if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
  const { cleanup } = await import('@testing-library/react')
  afterEach(() => cleanup())

  Object.defineProperty(window, 'trackAlign', {
    writable: true,
    configurable: true,
    value: {
      appName: 'TrackAlign',
      inspectFolder: vi.fn().mockResolvedValue({ cancelled: true }),
      refreshFolder: vi.fn().mockResolvedValue({ cancelled: false, folderPath: '/tmp/music', ignoredSymlinkCount: 0, files: [] }),
      rename: {
        apply: vi.fn().mockResolvedValue({ id: 'test-manifest' }),
        undoLatest: vi.fn().mockResolvedValue({ undone: true, id: 'test-manifest' }),
      },
      spotify: {
        authenticate: vi.fn().mockResolvedValue({ authenticated: true }),
        loadCollection: vi.fn().mockResolvedValue({ type: 'playlist', name: 'Mock Playlist', url: '', tracks: [] }),
        search: vi.fn().mockResolvedValue([]),
        signOut: vi.fn().mockResolvedValue({ signedOut: true }),
        status: vi.fn().mockResolvedValue({ connected: false }),
      },
      github: {
        authStart: vi.fn().mockResolvedValue({ userCode: 'ABCD-1234', verificationUri: 'https://github.com/login/device' }),
        onAuthStatus: vi.fn().mockReturnValue(() => {}),
        status: vi.fn().mockResolvedValue({ connected: false }),
        signOut: vi.fn().mockResolvedValue({ signedOut: true }),
        submitIssue: vi.fn().mockResolvedValue({ number: 1, htmlUrl: 'https://github.com/kelmankenberg/TrackAlign/issues/1' }),
        listDiscussionCategories: vi.fn().mockResolvedValue([]),
        listDiscussions: vi.fn().mockResolvedValue({ discussions: [], hasNextPage: false, endCursor: null }),
        getDiscussion: vi.fn().mockResolvedValue({ id: 'd1', number: 1, title: '', bodyHTML: '', createdAt: '', authorLogin: '', comments: [] }),
        createDiscussion: vi.fn().mockResolvedValue({ id: 'd1', number: 1, url: '' }),
        addDiscussionComment: vi.fn().mockResolvedValue({ id: 'c1' }),
      },
      window: {
        minimize: vi.fn().mockResolvedValue(true),
        toggleMaximize: vi.fn().mockResolvedValue(true),
        close: vi.fn().mockResolvedValue(true),
        toggleDevTools: vi.fn().mockResolvedValue(true),
      },
      zoom: {
        set: vi.fn().mockResolvedValue(1),
        get: vi.fn().mockResolvedValue(1),
      },
      shell: {
        openExternal: vi.fn().mockResolvedValue(true),
      },
    },
  })
}

