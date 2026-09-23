import { useEffect, useState } from 'react'
import { matchFiles, type MatchProposal } from '../../shared/matching'
import { renderFilename } from '../../shared/filename'

function describeError(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : fallback
  return raw.replace(/^Error invoking remote method '[^']*':\s*(Error:\s*)?/, '')
}
import {
  ChevronDown,
  CircleHelp,
  FileMusic,
  FolderOpen,
  HelpCircle,
  History,
  LayoutDashboard,
  ListMusic,
  ListOrdered,
  Menu,
  Minus,
  Moon,
  MoreHorizontal,
  PanelLeft,
  RefreshCw,
  RotateCcw,
  Settings,
  Square,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react'

type NavMode = 'expanded' | 'iconOnly' | 'toolbar'
type Page = 'workspace' | 'settings'
type SidePanel = 'help' | 'changelog' | null
type Theme = 'light-paper' | 'light-warm' | 'light-blue' | 'light-high-contrast' | 'dark-moss' | 'dark-vscode' | 'dark-charcoal' | 'dark-midnight'
type CollectionType = 'playlist' | 'album'

interface MockCollection {
  type: CollectionType
  name: string
  url: string
  tracks: Array<{ position: number; artist: string; title: string; album: string; year: number | null; duration: string; durationMs?: number }>
}

const lightThemes: Array<{ id: Theme; label: string; description: string }> = [
  { id: 'light-paper', label: 'Paper', description: 'Current TrackAlign light' },
  { id: 'light-warm', label: 'Warm', description: 'Soft ivory and terracotta' },
  { id: 'light-blue', label: 'Blue', description: 'Cool blue-gray workspace' },
  { id: 'light-high-contrast', label: 'Clear', description: 'Higher contrast light mode' },
]

const darkThemes: Array<{ id: Theme; label: string; description: string }> = [
  { id: 'dark-moss', label: 'Moss', description: 'The original greenish dark mode' },
  { id: 'dark-vscode', label: 'VS Code Default Dark', description: 'Familiar editor-inspired dark mode' },
  { id: 'dark-charcoal', label: 'Charcoal', description: 'Neutral graphite surfaces' },
  { id: 'dark-midnight', label: 'Midnight', description: 'Deep blue-black surfaces' },
]

const allThemes = [...lightThemes, ...darkThemes]
const isDarkTheme = (theme: Theme) => theme.startsWith('dark-')
const getStoredTheme = (): Theme => {
  const savedTheme = localStorage.getItem('trackalign-theme')
  if (allThemes.some((option) => option.id === savedTheme)) return savedTheme as Theme
  return savedTheme === 'dark' ? 'dark-moss' : 'light-paper'
}

const navItems: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const navModes: Array<{ id: NavMode; label: string; description: string }> = [
  { id: 'expanded', label: 'Full Nav', description: 'Side rail with icons and labels' },
  { id: 'iconOnly', label: 'Collapsed Nav', description: 'Icon-only side rail' },
  { id: 'toolbar', label: 'Titlebar Nav', description: 'Navigation moved into the top toolbar' },
]

const changelog = [
  { version: '0.1.0', date: 'September 2026', notes: ['Initial TrackAlign shell', 'Three-state navigation layout', 'Settings, Help, and Changelog panels'] },
  { version: 'Next', date: 'Planned', notes: ['Local audio folder inventory', 'Spotify OAuth with PKCE', 'Matching review workspace'] },
]

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1
const clampZoom = (factor: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(factor * 100) / 100))

function App() {
  const [navMode, setNavMode] = useState<NavMode>(() => (localStorage.getItem('trackalign-nav-mode') as NavMode) || 'expanded')
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [renameTemplate, setRenameTemplate] = useState(() => localStorage.getItem('trackalign-rename-template') || '{trackNumber} - {artist} - {title}')
  const [page, setPage] = useState<Page>('workspace')
  const [panel, setPanel] = useState<SidePanel>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [expandedChangelog, setExpandedChangelog] = useState('0.1.0')
  const [status, setStatus] = useState('Ready for a folder')
  const [zoomFactor, setZoomFactor] = useState(() => clampZoom(Number(localStorage.getItem('trackalign-zoom')) || 1))

  const applyZoom = (factor: number) => {
    const clamped = clampZoom(factor)
    setZoomFactor(clamped)
    localStorage.setItem('trackalign-zoom', String(clamped))
    window.trackAlign.zoom.set(clamped).catch(() => undefined)
  }

  useEffect(() => {
    window.trackAlign.zoom.set(zoomFactor).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key === '0') { event.preventDefault(); applyZoom(1) }
      else if (event.key === '-' || event.key === '_') { event.preventDefault(); applyZoom(zoomFactor - ZOOM_STEP) }
      else if (event.key === '=' || event.key === '+') { event.preventDefault(); applyZoom(zoomFactor + ZOOM_STEP) }
    }
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      applyZoom(zoomFactor + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
    }
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [zoomFactor])

  const runWindowCommand = async (command: () => Promise<boolean>, label: string) => {
    try {
      const result = await command()
      if (result === false) setStatus(`${label} could not be completed`)
    } catch (error) {
      console.error(`TrackAlign window command failed: ${label}`, error)
      setStatus(describeError(error, `${label} could not be completed`))
    }
  }

  const cycleNavMode = () => {
    const nextMode: NavMode = navMode === 'expanded' ? 'iconOnly' : navMode === 'iconOnly' ? 'toolbar' : 'expanded'
    setAppNavMode(nextMode)
  }

  const setAppNavMode = (nextMode: NavMode) => {
    setNavMode(nextMode)
    localStorage.setItem('trackalign-nav-mode', nextMode)
  }

  const setAppTheme = (nextTheme: Theme) => {
    setTheme(nextTheme)
    localStorage.setItem('trackalign-theme', nextTheme)
    localStorage.setItem(isDarkTheme(nextTheme) ? 'trackalign-last-dark-theme' : 'trackalign-last-light-theme', nextTheme)
  }

  const setAppRenameTemplate = (template: string) => {
    setRenameTemplate(template)
    localStorage.setItem('trackalign-rename-template', template)
  }

  const renderNavItems = (showLabels: boolean) => navItems.map(({ id, label, icon: Icon }) => (
    <button
      className={`nav-item ${page === id ? 'active' : ''}`}
      key={id}
      onClick={() => setPage(id)}
      title={label}
      aria-label={label}
    >
      <Icon size={18} strokeWidth={1.8} />
      {showLabels && <span>{label}</span>}
    </button>
  ))

  return (
    <div className="app-shell" data-theme={isDarkTheme(theme) ? 'dark' : 'light'} data-palette={theme}>
      <header className="topbar">
        <button className="toolbar-icon" onClick={cycleNavMode} title="Change navigation layout" aria-label="Change navigation layout">
          <PanelLeft size={19} />
        </button>
        <div className="brand-lockup">
          <div className="brand-mark"><ListOrdered size={17} /></div>
          <span className="brand-name">TrackAlign</span>
        </div>
        {navMode === 'toolbar' && <nav className="toolbar-nav" aria-label="Primary navigation">{renderNavItems(false)}</nav>}
        <div className="toolbar-drag-handle" aria-hidden="true" />
        <div className="toolbar-controls" onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          <button className="toolbar-action" onClick={() => setPanel('help')} title="Open contextual help" aria-label="Open contextual help"><CircleHelp size={18} /></button>
          <button className="toolbar-action" onClick={() => setMoreOpen((open) => !open)} title="More options" aria-label="More options"><MoreHorizontal size={19} /></button>
          <div className="window-controls" aria-label="Window controls">
            <button className="window-control" onClick={() => runWindowCommand(() => window.trackAlign.window.minimize(), 'Minimize')} title="Minimize" aria-label="Minimize"><Minus size={15} /></button>
            <button className="window-control" onClick={() => runWindowCommand(() => window.trackAlign.window.toggleMaximize(), 'Maximize')} title="Maximize or restore" aria-label="Maximize or restore"><Square size={13} /></button>
            <button className="window-control close-control" onClick={() => runWindowCommand(() => window.trackAlign.window.close(), 'Close')} title="Close" aria-label="Close"><X size={15} /></button>
          </div>
        </div>
        {moreOpen && <div className="more-menu">
          <button onClick={() => window.location.reload()}><RotateCcw size={16} />Restart TrackAlign</button>
          <button onClick={() => { setPanel('changelog'); setMoreOpen(false) }}><History size={16} />Changelog</button>
          <button onClick={() => { runWindowCommand(() => window.trackAlign.window.toggleDevTools(), 'Developer Tools'); setMoreOpen(false) }}><Settings size={16} />Developer Tools</button>
          <div className="menu-version">TrackAlign 0.1.0</div>
        </div>}
      </header>

      <div className="app-body">
        {navMode !== 'toolbar' && <aside className={`nav-rail ${navMode === 'iconOnly' ? 'icon-only' : ''}`} aria-label="Primary navigation">{renderNavItems(navMode === 'expanded')}</aside>}
        <main className="page-content">
          {page === 'workspace' ? <Workspace onHelp={() => setPanel('help')} onStatusChange={setStatus} renameTemplate={renameTemplate} /> : <SettingsPage onHelp={() => setPanel('help')} theme={theme} onThemeChange={setAppTheme} renameTemplate={renameTemplate} onRenameTemplateChange={setAppRenameTemplate} navMode={navMode} onNavModeChange={setAppNavMode} />}
        </main>
        {panel && <aside className="side-panel" aria-label={panel === 'help' ? 'Contextual help' : 'Changelog'}>
          <div className="panel-header">
            <div><span className="eyebrow">{panel === 'help' ? 'Support' : 'Release notes'}</span><h2>{panel === 'help' ? 'How TrackAlign works' : 'Changelog'}</h2></div>
            <button className="toolbar-icon" onClick={() => setPanel(null)} title="Close panel" aria-label="Close panel"><X size={18} /></button>
          </div>
          {panel === 'help' ? <div className="panel-copy"><p>Load a folder, choose the tracks you want to organize, then connect a Spotify playlist or album to review the proposed order.</p><p>Every match remains visible for inspection. You can adjust the plan before any files are renamed.</p><div className="help-tip"><HelpCircle size={16} /><span>Contextual guidance will follow the page you are viewing.</span></div><div className="help-tip"><HelpCircle size={16} /><span>Albums and playlists you create always work. Spotify blocks third-party access to algorithmic playlists such as Discover Weekly, Daily Mix, Release Radar, Blend, and Made For You &mdash; these will fail to load with a &ldquo;Forbidden&rdquo; error no app can bypass.</span></div></div> : <div className="changelog-list">{changelog.map((entry) => <section className="changelog-entry" key={entry.version}><button className="changelog-toggle" onClick={() => setExpandedChangelog(expandedChangelog === entry.version ? '' : entry.version)}><span><strong>{entry.version}</strong><small>{entry.date}</small></span><ChevronDown className={expandedChangelog === entry.version ? 'rotated' : ''} size={17} /></button>{expandedChangelog === entry.version && <ul>{entry.notes.map((note) => <li key={note}>{note}</li>)}</ul>}</section>)}</div>}
        </aside>}
      </div>
      <footer className="statusbar"><span className="status-dot" />{status}<span className="statusbar-spacer" /><span className="zoom-indicator" title="Zoom level (Ctrl+0/-/=/mouse wheel)">{Math.round(zoomFactor * 100)}%</span></footer>
    </div>
  )
}

function Workspace({ onHelp, onStatusChange, renameTemplate }: { onHelp: () => void; onStatusChange: (status: string) => void; renameTemplate: string }) {
  const [inventory, setInventory] = useState<FolderInventory | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [sourceOpen, setSourceOpen] = useState(false)
  const [sourceType, setSourceType] = useState<CollectionType>('playlist')
  const [sourceUrl, setSourceUrl] = useState('https://open.spotify.com/playlist/example')
  const [collection, setCollection] = useState<MockCollection | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameCompleted, setRenameCompleted] = useState(false)
  const [collectionExpanded, setCollectionExpanded] = useState(true)
  const [filesExpanded, setFilesExpanded] = useState(true)
  const [manualMatches, setManualMatches] = useState<Record<string, number | null>>({})
  const automaticProposals: MatchProposal[] = inventory && collection ? matchFiles((inventory.files ?? []).filter((file) => selectedPaths.has(file.path)), collection.tracks) : []
  const proposals: MatchProposal[] = automaticProposals.map((proposal) => {
    if (!(proposal.filePath in manualMatches)) return proposal
    const position = manualMatches[proposal.filePath]
    const track = collection?.tracks.find((candidate) => candidate.position === position)
    return track ? { ...proposal, trackPosition: track.position, trackTitle: track.title, trackArtist: track.artist, status: 'manual' as const, score: 1, evidence: ['manual'] } : { ...proposal, trackPosition: null, trackTitle: '', trackArtist: '', status: 'unmatched' as const, score: 0, evidence: [] }
  })

  const chooseFolder = async () => {
    setLoading(true)
    onStatusChange('Inspecting folder...')
    try {
      const result = await window.trackAlign.inspectFolder()
      if (!result.cancelled) {
        setInventory(result)
        setSelectedPaths(new Set(result.files?.map((file) => file.path)))
        setManualMatches({})
        setRenameCompleted(false)
        onStatusChange(`${result.files?.length ?? 0} audio files selected`)
      } else {
        onStatusChange('Ready for a folder')
      }
    } catch (error) {
      const message = describeError(error, 'Could not inspect that folder')
      console.error('TrackAlign folder inspection failed', error)
      onStatusChange(message)
    } finally {
      setLoading(false)
    }
  }

  const refreshFolder = async () => {
    if (!inventory?.folderPath) return
    setLoading(true)
    onStatusChange('Refreshing folder...')
    try {
      const previousPaths = new Set(inventory.files?.map((file) => file.path))
      const result = await window.trackAlign.refreshFolder(inventory.folderPath)
      setInventory(result)
      setSelectedPaths((current) => new Set((result.files ?? []).filter((file) => !previousPaths.has(file.path) || current.has(file.path)).map((file) => file.path)))
      setManualMatches({})
      setRenameCompleted(false)
      onStatusChange(`${result.files?.length ?? 0} audio files found`)
    } catch (error) {
      onStatusChange(describeError(error, 'Could not refresh that folder'))
    } finally {
      setLoading(false)
    }
  }

  const setAllSelected = (selected: boolean) => {
    const nextSelection = selected ? new Set(inventory?.files?.map((file) => file.path)) : new Set<string>()
    setSelectedPaths(nextSelection)
    onStatusChange(`${nextSelection.size} audio files selected`)
  }

  const toggleFile = (path: string) => {
    const nextSelection = new Set(selectedPaths)
    if (nextSelection.has(path)) nextSelection.delete(path)
    else nextSelection.add(path)
    setSelectedPaths(nextSelection)
    onStatusChange(`${nextSelection.size} audio files selected`)
  }

  const loadSpotifyCollection = async () => {
    setSourceLoading(true)
    setSourceError('')
    onStatusChange('Loading Spotify collection...')
    try {
      const nextCollection = await window.trackAlign.spotify.loadCollection(sourceUrl)
      setCollection(nextCollection)
      setSourceOpen(false)
      setManualMatches({})
      setRenameCompleted(false)
      onStatusChange(`${nextCollection.name} loaded · ${nextCollection.tracks.length} tracks`)
    } catch (error) {
      const message = describeError(error, 'Spotify could not be connected.')
      setSourceError(message)
      onStatusChange('Spotify connection needs attention')
    } finally {
      setSourceLoading(false)
    }
  }

  const applyRename = async () => {
    if (!inventory || !collection) return
    const items = proposals.flatMap((proposal) => {
      if (!proposal.trackPosition) return []
      const localFile = inventory.files?.find((file) => file.path === proposal.filePath)
      const track = collection.tracks.find((candidate) => candidate.position === proposal.trackPosition)
      if (!localFile || !track) return []
      return [{ sourcePath: localFile.path, targetName: renderFilename(renameTemplate, { trackNumber: track.position, artist: track.artist, title: track.title, album: track.album, year: track.year }, localFile.extension) }]
    })
    setRenameLoading(true)
    onStatusChange('Validating rename plan...')
    try {
      await window.trackAlign.rename.apply(items)
      setRenameCompleted(true)
      onStatusChange(`${items.length} files renamed · undo available`)
    } catch (error) {
      onStatusChange(describeError(error, 'Rename could not be completed'))
    } finally {
      setRenameLoading(false)
    }
  }

  const undoRename = async () => {
    try {
      await window.trackAlign.rename.undoLatest()
      setRenameCompleted(false)
      onStatusChange('Rename undone')
    } catch (error) {
      onStatusChange(describeError(error, 'Undo could not be completed'))
    }
  }

  return <section className="workspace-page">
    <div className="page-heading"><div><span className="eyebrow">Workspace</span><h1>Align your collection.</h1><p>Match local audio to Spotify order, review the plan, and rename with confidence.</p></div><button className="secondary-button" onClick={onHelp}><CircleHelp size={16} />Help</button></div>
    <div className="hero-grid">
      <button className="action-card primary-card" onClick={chooseFolder} disabled={loading}><div className="card-icon"><FolderOpen size={22} /></div><div><span className="card-kicker">Step 01</span><h2>{loading ? 'Inspecting folder...' : 'Choose a folder'}</h2><p>Open a local folder to inspect its audio files.</p></div><span className="card-arrow">→</span></button>
      <button className="action-card" onClick={() => setSourceOpen(true)}><div className="card-icon"><ListMusic size={22} /></div><div><span className="card-kicker">Step 02</span><h2>{collection ? collection.name : 'Connect Spotify'}</h2><p>{collection ? `${collection.tracks.length} tracks loaded in ${collection.type} order.` : 'Load a playlist or album and its original order.'}</p></div><span className="card-arrow">→</span></button>
    </div>
      {inventory && collection && <div className="rename-actions"><span><strong>Ready to apply:</strong> {proposals.filter((proposal) => proposal.status === 'matched' || proposal.status === 'manual').length} matched files</span><div><button className="primary-button" onClick={applyRename} disabled={renameLoading || renameCompleted}>{renameLoading ? 'Renaming...' : renameCompleted ? 'Rename complete' : 'Apply rename'}</button>{renameCompleted && <button className="secondary-button" onClick={undoRename}>Undo</button>}</div></div>}
    {sourceOpen && <div className="source-dialog" role="dialog" aria-label="Load Spotify collection"><div className="source-dialog-heading"><div><span className="eyebrow">Spotify source</span><h2>Load a playlist or album</h2></div><button className="toolbar-icon" onClick={() => setSourceOpen(false)} title="Close" aria-label="Close"><X size={18} /></button></div><div className="source-tabs" role="tablist" aria-label="Spotify source type"><button className={sourceType === 'playlist' ? 'selected' : ''} onClick={() => setSourceType('playlist')}>Playlist</button><button className={sourceType === 'album' ? 'selected' : ''} onClick={() => setSourceType('album')}>Album</button></div><label className="source-label">Spotify URL<input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} onClick={(event) => event.currentTarget.select()} placeholder="https://open.spotify.com/..." /></label><p className="source-note">TrackAlign opens Spotify for authorization the first time, then reuses that connection for future loads.</p>{sourceError && <p className="source-error" role="alert">{sourceError}</p>}<button className="primary-button" onClick={loadSpotifyCollection} disabled={sourceLoading}><ListMusic size={16} />{sourceLoading ? 'Loading...' : 'Load collection'}</button></div>}
    {collection && <div className="collection-preview"><div className="preview-heading"><div><span className="eyebrow">Spotify collection</span><h2>{collection.name}</h2></div><div className="preview-actions"><span className="status-pill"><span className="status-dot" />{collection.tracks.length} tracks</span><button className="toolbar-icon" onClick={() => setCollectionExpanded((value) => !value)} title={collectionExpanded ? 'Collapse' : 'Expand'} aria-label={collectionExpanded ? 'Collapse Spotify collection' : 'Expand Spotify collection'} aria-expanded={collectionExpanded}><ChevronDown size={16} className={collectionExpanded ? 'rotated' : ''} /></button></div></div>{collectionExpanded && <div className="collection-track-list">{collection.tracks.map((track) => <div className="collection-track" key={track.position}><span className="track-position">{String(track.position).padStart(2, '0')}</span><div><strong>{track.title}</strong><span>{track.artist}</span></div><span className="track-duration">{track.duration}</span></div>)}</div>}</div>}
    {inventory && <div className="review-preview"><div className="preview-heading"><div><span className="eyebrow">Local files</span><h2>{inventory.folderPath}</h2></div><div className="preview-actions"><span className="status-pill"><span className="status-dot" />{collection ? `${proposals.filter((proposal) => proposal.status === 'matched' || proposal.status === 'manual').length} of ${selectedPaths.size} matched` : `${selectedPaths.size} of ${inventory.files?.length ?? 0} selected`}</span><button className="toolbar-icon" onClick={refreshFolder} disabled={loading} title="Refresh folder" aria-label="Refresh folder"><RefreshCw size={16} className={loading ? 'spinning' : ''} /></button><button className="toolbar-icon" onClick={() => setFilesExpanded((value) => !value)} title={filesExpanded ? 'Collapse' : 'Expand'} aria-label={filesExpanded ? 'Collapse local files' : 'Expand local files'} aria-expanded={filesExpanded}><ChevronDown size={16} className={filesExpanded ? 'rotated' : ''} /></button></div></div>{filesExpanded && (inventory.files?.length ? <div className="review-table"><div className="inventory-summary"><span>{inventory.ignoredSymlinkCount ? `${inventory.ignoredSymlinkCount} symbolic link${inventory.ignoredSymlinkCount === 1 ? '' : 's'} ignored.` : 'No symbolic links found.'}</span><span className="selection-actions"><button onClick={() => setAllSelected(true)}>Select all</button><button onClick={() => setAllSelected(false)}>Select none</button></span></div><div className="review-header"><span>Include</span><span>Local file</span><span>Spotify match</span><span>Expected filename</span><span>Confidence</span><span>Status</span></div>{inventory.files.map((file) => { const proposal = proposals.find((candidate) => candidate.filePath === file.path); const track = proposal && collection ? collection.tracks.find((candidate) => candidate.position === proposal.trackPosition) : undefined; const expectedName = track && collection ? renderFilename(renameTemplate, { trackNumber: track.position, artist: track.artist, title: track.title, album: track.album, year: track.year }, file.extension) : file.name; return <div className={`inventory-row ${file.hidden ? 'hidden-file' : ''} ${file.readOnly ? 'read-only' : ''}`} key={file.path}><label className="file-select"><input type="checkbox" checked={selectedPaths.has(file.path)} onChange={() => toggleFile(file.path)} aria-label={`Select ${file.name}`} /></label><div className="file-name"><FileMusic size={16} /><span>{file.name}</span>{file.readOnly && <span className="file-warning">Read-only</span>}{file.hidden && <span className="file-warning">Hidden</span>}</div>{collection ? <select className="match-select" value={proposal?.trackPosition ?? ''} disabled={!selectedPaths.has(file.path)} onChange={(event) => setManualMatches((current) => ({ ...current, [file.path]: event.target.value ? Number(event.target.value) : null }))} aria-label={`Match for ${file.name}`}><option value="">No match</option>{collection.tracks.map((candidate) => <option key={candidate.position} value={candidate.position}>{String(candidate.position).padStart(2, '0')} · {candidate.artist} — {candidate.title}</option>)}</select> : <span className="review-placeholder">Connect Spotify to match</span>}<span className="expected-name">{expectedName}</span><span>{proposal ? `${Math.round(proposal.score * 100)}% ${proposal.evidence.length ? `· ${proposal.evidence.join(', ')}` : ''}` : '—'}</span><span className={proposal ? `match-status ${proposal.status}` : `match-status${selectedPaths.has(file.path) ? '' : ' excluded'}`}>{proposal ? proposal.status : selectedPaths.has(file.path) ? 'selected' : 'excluded'}</span></div> })}</div> : <div className="empty-state compact"><div className="empty-icon"><FileMusic size={25} /></div><p>No supported audio files found.</p><span>TrackAlign supports MP3, FLAC, OGG, and M4A.</span></div>)}</div>}
    {!inventory && <div className="workspace-preview"><div className="empty-state"><div className="empty-icon"><FileMusic size={25} /></div><p>Select a folder to begin building your review table.</p><span>Current filenames and expected Spotify filenames will sit side by side.</span></div></div>}
  </section>
}

function SettingsPage({ onHelp, theme, onThemeChange, renameTemplate, onRenameTemplateChange, navMode, onNavModeChange }: { onHelp: () => void; theme: Theme; onThemeChange: (theme: Theme) => void; renameTemplate: string; onRenameTemplateChange: (template: string) => void; navMode: NavMode; onNavModeChange: (mode: NavMode) => void }) {
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(null)

  useEffect(() => {
    window.trackAlign.spotify.status().then((status) => setSpotifyConnected(status.connected)).catch(() => setSpotifyConnected(false))
  }, [])

  const handleSignOut = async () => {
    await window.trackAlign.spotify.signOut()
    setSpotifyConnected(false)
  }

  return <section className="settings-page">
    <div className="page-heading"><div><span className="eyebrow">Preferences</span><h1>Settings</h1><p>Make TrackAlign fit the way you organize music.</p></div><button className="secondary-button" onClick={onHelp}><CircleHelp size={16} />Help</button></div>
    <div className="settings-list"><div className="setting-row template-row"><div className="setting-icon"><SlidersHorizontal size={18} /></div><div><h2>Rename template</h2><p>Choose the fields that shape expected filenames.</p><div className="template-input-row"><div className="template-input-wrap"><input className="template-input" value={renameTemplate} onChange={(event) => onRenameTemplateChange(event.target.value)} aria-label="Rename template" />{renameTemplate && <button type="button" className="template-clear" onClick={() => onRenameTemplateChange('')} title="Clear template" aria-label="Clear template"><X size={14} /></button>}</div><button type="button" className="ghost-button" onClick={() => onRenameTemplateChange('{trackNumber} - {artist} - {title}')} title="Reset to default template" aria-label="Reset to default template"><RotateCcw size={14} />Default</button></div><div className="template-tokens">{['{trackNumber}', '{artist}', '{album}', '{title}', '{year}'].map((token) => <button key={token} onClick={() => onRenameTemplateChange(`${renameTemplate}${renameTemplate ? ' - ' : ''}${token}`)}>{token}</button>)}</div></div></div><div className="setting-row navigation-row"><div className="setting-icon"><Menu size={18} /></div><div><h2>Navigation layout</h2><p>Your preferred rail state is remembered between launches.</p><div className="nav-mode-options">{navModes.map((option) => <button key={option.id} className={`nav-mode-option ${navMode === option.id ? 'selected' : ''}`} onClick={() => onNavModeChange(option.id)} title={option.description}><Menu size={13} />{option.label}</button>)}</div></div></div><div className="setting-row appearance-row"><div className="setting-icon">{isDarkTheme(theme) ? <Moon size={18} /> : <Sun size={18} />}</div><div><h2>Appearance</h2><p>Choose a light or dark workspace and keep the choice between launches.</p><div className="theme-groups"><div><span className="theme-group-label">Light</span><div className="theme-options">{lightThemes.map((option) => <button key={option.id} className={`theme-option ${theme === option.id ? 'selected' : ''}`} onClick={() => onThemeChange(option.id)} title={option.description}><Sun size={13} />{option.label}</button>)}</div></div><div><span className="theme-group-label">Dark</span><div className="theme-options">{darkThemes.map((option) => <button key={option.id} className={`theme-option ${theme === option.id ? 'selected' : ''}`} onClick={() => onThemeChange(option.id)} title={option.description}><Moon size={13} />{option.label}</button>)}</div></div></div></div></div><div className="setting-row"><div className="setting-icon"><ListMusic size={18} /></div><div><h2>Spotify connection</h2><p>{spotifyConnected === null ? 'Checking connection…' : spotifyConnected ? 'Connected. Your session is reused for future collection loads.' : 'Not connected. Connect from the Workspace page.'}</p></div>{spotifyConnected && <button className="ghost-button" onClick={handleSignOut}>Disconnect</button>}</div></div>
  </section>
}

export default App
