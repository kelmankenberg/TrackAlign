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
})
