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
        signOut: vi.fn().mockResolvedValue({ signedOut: true }),
        status: vi.fn().mockResolvedValue({ connected: false }),
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
    },
  })
}

