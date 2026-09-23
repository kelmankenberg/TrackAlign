// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  vi.mocked(window.trackAlign.inspectFolder).mockReset()
})

describe('App shell', () => {
  it('renders the Workspace page by default', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /align your collection/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /choose a folder/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /connect spotify/i })).toBeInTheDocument()
  })

  it('navigates to Settings and back to Workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Workspace' }))
    expect(screen.getByRole('heading', { name: /align your collection/i })).toBeInTheDocument()
  })

  it('gives every icon-only toolbar control an accessible name', () => {
    render(<App />)
    for (const name of ['Change navigation layout', 'Open contextual help', 'More options', 'Minimize', 'Maximize or restore', 'Close']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('persists the navigation layout mode across the cycle', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggle = screen.getByRole('button', { name: 'Change navigation layout' })
    expect(localStorage.getItem('trackalign-nav-mode')).toBeNull()

    await user.click(toggle)
    expect(localStorage.getItem('trackalign-nav-mode')).toBe('iconOnly')

    await user.click(toggle)
    expect(localStorage.getItem('trackalign-nav-mode')).toBe('toolbar')

    await user.click(toggle)
    expect(localStorage.getItem('trackalign-nav-mode')).toBe('expanded')
  })

  it('switches and persists an appearance preset from Settings', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    await user.click(screen.getByRole('button', { name: /vs code default dark/i }))
    expect(localStorage.getItem('trackalign-theme')).toBe('dark-vscode')
  })

  it('resets and clears the rename template', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    const input = screen.getByRole('textbox', { name: /rename template/i }) as HTMLInputElement
    expect(input.value).toBe('{trackNumber} - {artist} - {title}')

    await user.clear(input)
    await user.type(input, 'custom')
    expect(input.value).toBe('custom')

    await user.click(screen.getByRole('button', { name: /clear template/i }))
    expect(input.value).toBe('')

    await user.click(screen.getByRole('button', { name: /reset to default template/i }))
    expect(input.value).toBe('{trackNumber} - {artist} - {title}')
  })

  it('renders the local inventory empty state before a folder is loaded', () => {
    render(<App />)
    expect(screen.getByText(/select a folder to begin/i)).toBeInTheDocument()
  })

  it('zooms with keyboard shortcuts and persists the level', async () => {
    render(<App />)
    expect(screen.getByTitle(/zoom level/i)).toHaveTextContent('100%')

    fireEvent.keyDown(window, { key: '=', ctrlKey: true })
    expect(screen.getByTitle(/zoom level/i)).toHaveTextContent('110%')
    expect(localStorage.getItem('trackalign-zoom')).toBe('1.1')

    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    expect(screen.getByTitle(/zoom level/i)).toHaveTextContent('90%')

    fireEvent.keyDown(window, { key: '0', ctrlKey: true })
    expect(screen.getByTitle(/zoom level/i)).toHaveTextContent('100%')
  })

  it('zooms with Ctrl+wheel', () => {
    render(<App />)
    fireEvent.wheel(window, { ctrlKey: true, deltaY: -100 })
    expect(screen.getByTitle(/zoom level/i)).toHaveTextContent('110%')
  })

  it('shows local files with selection checkboxes before a Spotify collection is loaded', async () => {
    vi.mocked(window.trackAlign.inspectFolder).mockResolvedValueOnce({
      cancelled: false,
      folderPath: '/music/Album',
      ignoredSymlinkCount: 0,
      files: [
        { name: 'One.mp3', path: '/music/Album/One.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: {} },
        { name: 'Two.mp3', path: '/music/Album/Two.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: {} },
      ],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /choose a folder/i }).closest('button')!)
    const fileNameCells = await screen.findAllByText('One.mp3')
    expect(fileNameCells.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Connect Spotify to match')).toHaveLength(2)

    const row = fileNameCells[0].closest('.inventory-row') as HTMLElement
    const checkbox = within(row).getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)

    await user.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  it('collapses and re-expands the local files panel', async () => {
    vi.mocked(window.trackAlign.inspectFolder).mockResolvedValueOnce({
      cancelled: false,
      folderPath: '/music/Album',
      ignoredSymlinkCount: 0,
      files: [{ name: 'One.mp3', path: '/music/Album/One.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: {} }],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /choose a folder/i }).closest('button')!)
    await screen.findAllByText('One.mp3')

    await user.click(screen.getByRole('button', { name: 'Collapse local files' }))
    expect(screen.queryByText('One.mp3')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand local files' }))
    expect(await screen.findAllByText('One.mp3')).toHaveLength(2)
  })

  it('navigates to Discussions and shows a GitHub connect prompt when not connected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Discussions' }))
    expect(screen.getByRole('heading', { name: /join the conversation/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /connect github/i })).toBeInTheDocument()
  })

  it('shows page-specific Help content that switches with the current page', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Discussions' }))
    await user.click(screen.getByRole('button', { name: 'Help' }))
    const helpPanel = screen.getByRole('complementary', { name: 'Contextual help' })
    expect(within(helpPanel).getByRole('heading', { name: 'Discussions help' })).toBeInTheDocument()
    expect(within(helpPanel).getByText(/connect your github account once to browse, start, and reply/i)).toBeInTheDocument()
    expect(within(helpPanel).queryByText(/build the expected filename from tokens/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(within(helpPanel).getByRole('heading', { name: 'Settings help' })).toBeInTheDocument()
    expect(within(helpPanel).getByText(/build the expected filename from tokens/i)).toBeInTheDocument()
    expect(within(helpPanel).queryByText(/connect your github account once to browse, start, and reply/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Workspace' }))
    expect(within(helpPanel).getByRole('heading', { name: 'Workspace help' })).toBeInTheDocument()
    expect(within(helpPanel).getByText(/load a folder, choose the tracks/i)).toBeInTheDocument()
  })

  it('opens the Report an issue slideout from the More menu with a GitHub connect prompt', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(screen.getByRole('button', { name: 'Report an issue' }))

    expect(screen.getByRole('heading', { name: /report an issue/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /connect github/i })).toBeInTheDocument()
  })

  it('renders the Markdown changelog as collapsible release sections', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(screen.getByRole('button', { name: 'Changelog' }))

    const panel = screen.getByRole('complementary', { name: 'Changelog' })
    expect(within(panel).getByText(/initial trackalign desktop shell/i)).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: /next.*planned/i }))
    expect(within(panel).getByText(/native spotify library browsing/i)).toBeInTheDocument()
    expect(within(panel).queryByText(/initial trackalign desktop shell/i)).not.toBeInTheDocument()
  })

  it('keeps the loaded folder in Workspace after navigating to Settings and back', async () => {
    vi.mocked(window.trackAlign.inspectFolder).mockResolvedValueOnce({
      cancelled: false,
      folderPath: '/music/Album',
      ignoredSymlinkCount: 0,
      files: [{ name: 'One.mp3', path: '/music/Album/One.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: {} }],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /choose a folder/i }).closest('button')!)
    await screen.findAllByText('One.mp3')

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Workspace' }))
    expect(await screen.findAllByText('One.mp3')).toHaveLength(2)
    expect(window.trackAlign.inspectFolder).toHaveBeenCalledTimes(1)
  })

  it('clears the loaded folder from Workspace via Start over', async () => {
    vi.mocked(window.trackAlign.inspectFolder).mockResolvedValueOnce({
      cancelled: false,
      folderPath: '/music/Album',
      ignoredSymlinkCount: 0,
      files: [{ name: 'One.mp3', path: '/music/Album/One.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: {} }],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /choose a folder/i }).closest('button')!)
    await screen.findAllByText('One.mp3')

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.queryByText('One.mp3')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /choose a folder/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start over' })).not.toBeInTheDocument()
  })

  it('searches Spotify and loads the selected result', async () => {
    vi.mocked(window.trackAlign.spotify.search).mockResolvedValueOnce([
      { type: 'playlist', id: 'p1', name: 'Road Trip Mix', subtitle: 'By Alex', url: 'https://open.spotify.com/playlist/p1', trackCount: 15 },
    ])
    vi.mocked(window.trackAlign.spotify.loadCollection).mockResolvedValueOnce({ type: 'playlist', name: 'Road Trip Mix', url: 'https://open.spotify.com/playlist/p1', tracks: [] })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /connect spotify/i }).closest('button')!)
    await user.type(screen.getByRole('combobox', { name: /search spotify/i }), 'road trip')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    const result = await screen.findByRole('button', { name: /road trip mix/i })
    await user.click(result)

    expect(window.trackAlign.spotify.loadCollection).toHaveBeenCalledWith('https://open.spotify.com/playlist/p1')
    expect((await screen.findAllByRole('heading', { name: 'Road Trip Mix' })).length).toBeGreaterThanOrEqual(1)
  })

  it('remembers the last 10 Spotify searches and offers them from the search input', async () => {
    vi.mocked(window.trackAlign.spotify.search).mockResolvedValue([])
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /connect spotify/i }).closest('button')!)
    const searchInput = screen.getByRole('combobox', { name: /search spotify/i })
    await user.type(searchInput, 'road trip')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(JSON.parse(localStorage.getItem('trackalign-search-history') || '[]')).toEqual(['road trip'])
    expect(document.getElementById('spotify-search-history')?.querySelector('option')?.getAttribute('value')).toBe('road trip')
  })

  it('lets Help sections collapse and expand independently, with only the first expanded by default', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open contextual help' }))
    expect(screen.getByText(/load a folder, choose the tracks/i)).toBeInTheDocument()
    expect(screen.queryByText(/search box in the load a playlist or album dialog/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Finding a Spotify playlist or album' }))
    expect(screen.getByText(/search box in the load a playlist or album dialog/i)).toBeInTheDocument()
    expect(screen.queryByText(/load a folder, choose the tracks/i)).not.toBeInTheDocument()
  })

  it('shows collection tracks with no local file as a highlighted missing row, resolvable via reverse match', async () => {
    vi.mocked(window.trackAlign.inspectFolder).mockResolvedValueOnce({
      cancelled: false,
      folderPath: '/music/Album',
      ignoredSymlinkCount: 0,
      files: [
        { name: 'One.mp3', path: '/music/Album/One.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: { title: 'Song One', artist: 'Artist A' } },
        { name: 'Extra.mp3', path: '/music/Album/Extra.mp3', extension: '.mp3', hidden: false, readOnly: false, metadata: { title: 'Totally Unrelated', artist: 'Nobody' } },
      ],
    })
    vi.mocked(window.trackAlign.spotify.loadCollection).mockResolvedValueOnce({
      type: 'playlist',
      name: 'Two Tracks',
      url: 'https://open.spotify.com/playlist/two',
      tracks: [
        { position: 1, artist: 'Artist A', title: 'Song One', album: 'Album', year: 2020, duration: '3:00', durationMs: 180000 },
        { position: 2, artist: 'Artist B', title: 'Song Two', album: 'Album', year: 2020, duration: '3:00', durationMs: 180000 },
      ],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('heading', { name: /choose a folder/i }).closest('button')!)
    await screen.findAllByText('One.mp3')

    await user.click(screen.getByRole('heading', { name: /connect spotify/i }).closest('button')!)
    await user.click(screen.getByRole('button', { name: /^load collection$/i }))

    expect(await screen.findByRole('combobox', { name: /assign a local file to song two/i })).toBeInTheDocument()
    expect(screen.getByText('missing')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /assign a local file to song two/i }), '/music/Album/Extra.mp3')

    expect(screen.queryByText('missing')).not.toBeInTheDocument()
  })
})
