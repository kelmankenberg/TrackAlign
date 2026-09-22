import { useState } from 'react'
import {
  ChevronDown,
  CircleHelp,
  FileMusic,
  FolderOpen,
  HelpCircle,
  History,
  LayoutDashboard,
  ListMusic,
  Menu,
  MoreHorizontal,
  PanelLeft,
  PlayCircle,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

type NavMode = 'expanded' | 'iconOnly' | 'toolbar'
type Page = 'workspace' | 'settings'
type SidePanel = 'help' | 'changelog' | null

const navItems: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const changelog = [
  { version: '0.1.0', date: 'September 2026', notes: ['Initial TrackAlign shell', 'Three-state navigation layout', 'Settings, Help, and Changelog panels'] },
  { version: 'Next', date: 'Planned', notes: ['Local audio folder inventory', 'Spotify OAuth with PKCE', 'Matching review workspace'] },
]

function App() {
  const [navMode, setNavMode] = useState<NavMode>(() => (localStorage.getItem('trackalign-nav-mode') as NavMode) || 'expanded')
  const [page, setPage] = useState<Page>('workspace')
  const [panel, setPanel] = useState<SidePanel>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [expandedChangelog, setExpandedChangelog] = useState('0.1.0')
  const [status, setStatus] = useState('Ready for a folder')

  const cycleNavMode = () => {
    const nextMode: NavMode = navMode === 'expanded' ? 'iconOnly' : navMode === 'iconOnly' ? 'toolbar' : 'expanded'
    setNavMode(nextMode)
    localStorage.setItem('trackalign-nav-mode', nextMode)
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
    <div className="app-shell">
      <header className="topbar">
        <button className="toolbar-icon" onClick={cycleNavMode} title="Change navigation layout" aria-label="Change navigation layout">
          <PanelLeft size={19} />
        </button>
        <div className="brand-lockup">
          <div className="brand-mark"><Sparkles size={16} /></div>
          <span className="brand-name">TrackAlign</span>
        </div>
        {navMode === 'toolbar' && <nav className="toolbar-nav" aria-label="Primary navigation">{renderNavItems(false)}</nav>}
        <div className="toolbar-spacer" />
        <button className="toolbar-action" onClick={() => setPanel('help')} title="Open contextual help" aria-label="Open contextual help"><CircleHelp size={18} /></button>
        <button className="toolbar-action" onClick={() => setMoreOpen((open) => !open)} title="More options" aria-label="More options"><MoreHorizontal size={19} /></button>
        {moreOpen && <div className="more-menu">
          <button onClick={() => window.location.reload()}><RotateCcw size={16} />Restart TrackAlign</button>
          <button onClick={() => { setPanel('changelog'); setMoreOpen(false) }}><History size={16} />Changelog</button>
          <div className="menu-version">TrackAlign 0.1.0</div>
        </div>}
      </header>

      <div className="app-body">
        {navMode !== 'toolbar' && <aside className={`nav-rail ${navMode === 'iconOnly' ? 'icon-only' : ''}`} aria-label="Primary navigation">{renderNavItems(navMode === 'expanded')}</aside>}
        <main className="page-content">
          {page === 'workspace' ? <Workspace onHelp={() => setPanel('help')} onStatusChange={setStatus} /> : <SettingsPage onHelp={() => setPanel('help')} />}
        </main>
        {panel && <aside className="side-panel" aria-label={panel === 'help' ? 'Contextual help' : 'Changelog'}>
          <div className="panel-header">
            <div><span className="eyebrow">{panel === 'help' ? 'Support' : 'Release notes'}</span><h2>{panel === 'help' ? 'How TrackAlign works' : 'Changelog'}</h2></div>
            <button className="toolbar-icon" onClick={() => setPanel(null)} title="Close panel" aria-label="Close panel"><X size={18} /></button>
          </div>
          {panel === 'help' ? <div className="panel-copy"><p>Load a folder, choose the tracks you want to organize, then connect a Spotify playlist or album to review the proposed order.</p><p>Every match remains visible for inspection. You can adjust the plan before any files are renamed.</p><div className="help-tip"><HelpCircle size={16} /><span>Contextual guidance will follow the page you are viewing.</span></div></div> : <div className="changelog-list">{changelog.map((entry) => <section className="changelog-entry" key={entry.version}><button className="changelog-toggle" onClick={() => setExpandedChangelog(expandedChangelog === entry.version ? '' : entry.version)}><span><strong>{entry.version}</strong><small>{entry.date}</small></span><ChevronDown className={expandedChangelog === entry.version ? 'rotated' : ''} size={17} /></button>{expandedChangelog === entry.version && <ul>{entry.notes.map((note) => <li key={note}>{note}</li>)}</ul>}</section>)}</div>}
        </aside>}
      </div>
      <footer className="statusbar"><span className="status-dot" />{status}</footer>
    </div>
  )
}

function Workspace({ onHelp, onStatusChange }: { onHelp: () => void; onStatusChange: (status: string) => void }) {
  const [inventory, setInventory] = useState<FolderInventory | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  const chooseFolder = async () => {
    setLoading(true)
    onStatusChange('Inspecting folder...')
    try {
      const result = await window.trackAlign.inspectFolder()
      if (!result.cancelled) {
        setInventory(result)
        setSelectedPaths(new Set(result.files?.map((file) => file.path)))
        onStatusChange(`${result.files?.length ?? 0} audio files selected`)
      } else {
        onStatusChange('Ready for a folder')
      }
    } catch {
      onStatusChange('Could not inspect that folder')
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

  return <section className="workspace-page">
    <div className="page-heading"><div><span className="eyebrow">Workspace</span><h1>Align your collection.</h1><p>Match local audio to Spotify order, review the plan, and rename with confidence.</p></div><button className="secondary-button" onClick={onHelp}><CircleHelp size={16} />Help</button></div>
    <div className="hero-grid">
      <button className="action-card primary-card" onClick={chooseFolder} disabled={loading}><div className="card-icon"><FolderOpen size={22} /></div><div><span className="card-kicker">Step 01</span><h2>{loading ? 'Inspecting folder...' : 'Choose a folder'}</h2><p>Open a local folder to inspect its audio files.</p></div><span className="card-arrow">→</span></button>
      <button className="action-card"><div className="card-icon"><ListMusic size={22} /></div><div><span className="card-kicker">Step 02</span><h2>Connect Spotify</h2><p>Load a playlist or album and its original order.</p></div><span className="card-arrow">→</span></button>
    </div>
    <div className="workspace-preview"><div className="preview-heading"><div><span className="eyebrow">Local inventory</span><h2>{inventory?.folderPath ?? 'Your alignment will appear here'}</h2></div><span className="status-pill"><span className="status-dot" />{inventory ? `${selectedPaths.size} of ${inventory.files?.length ?? 0} selected` : 'Waiting'}</span></div>{inventory ? <div className="inventory-table"><div className="inventory-summary"><span>{inventory.ignoredSymlinkCount ? `${inventory.ignoredSymlinkCount} symbolic link${inventory.ignoredSymlinkCount === 1 ? '' : 's'} ignored.` : 'No symbolic links found.'}</span><span className="selection-actions"><button onClick={() => setAllSelected(true)}>Select all</button><button onClick={() => setAllSelected(false)}>Select none</button></span></div>{inventory.files?.length ? inventory.files.map((file) => <div className={`inventory-row ${file.hidden ? 'hidden-file' : ''} ${file.readOnly ? 'read-only' : ''}`} key={file.path}><label className="file-select"><input type="checkbox" checked={selectedPaths.has(file.path)} onChange={() => toggleFile(file.path)} aria-label={`Select ${file.name}`} /></label><div className="file-name"><FileMusic size={16} /><span>{file.name}</span></div><span>{file.metadata.artist || 'Unknown artist'}</span><span>{file.metadata.title || 'Metadata unavailable'}</span>{file.readOnly && <span className="file-warning">Read-only</span>}{file.hidden && <span className="file-warning">Hidden</span>}</div>) : <div className="empty-state compact"><div className="empty-icon"><FileMusic size={25} /></div><p>No supported audio files found.</p><span>TrackAlign supports MP3, FLAC, OGG, and M4A.</span></div>}</div> : <div className="empty-state"><div className="empty-icon"><FileMusic size={25} /></div><p>Select a folder to begin building your review table.</p><span>Current filenames and expected Spotify filenames will sit side by side.</span></div>}</div>
  </section>
}

function SettingsPage({ onHelp }: { onHelp: () => void }) {
  return <section className="settings-page">
    <div className="page-heading"><div><span className="eyebrow">Preferences</span><h1>Settings</h1><p>Make TrackAlign fit the way you organize music.</p></div><button className="secondary-button" onClick={onHelp}><CircleHelp size={16} />Help</button></div>
    <div className="settings-list"><div className="setting-row"><div className="setting-icon"><SlidersHorizontal size={18} /></div><div><h2>Rename template</h2><p>Choose the fields that shape expected filenames.</p></div><button className="ghost-button">Configure <ChevronDown size={15} /></button></div><div className="setting-row"><div className="setting-icon"><Menu size={18} /></div><div><h2>Navigation layout</h2><p>Your preferred rail state is remembered between launches.</p></div><span className="setting-value">Automatic</span></div><div className="setting-row"><div className="setting-icon"><PlayCircle size={18} /></div><div><h2>Startup behavior</h2><p>Start with a clean workspace after restarting TrackAlign.</p></div><span className="setting-value">Clean start</span></div></div>
  </section>
}

export default App
