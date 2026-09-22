/// <reference types="vite/client" />

declare module '*.css'

interface LocalAudioFile {
	name: string
	path: string
	extension: string
	hidden: boolean
	readOnly: boolean
	metadata: {
		title?: string
		artist?: string
		album?: string
		year?: number | null
		trackNumber?: number | null
		durationMs?: number | null
	}
}

interface FolderInventory {
	cancelled: boolean
	folderPath?: string
	ignoredSymlinkCount?: number
	files?: LocalAudioFile[]
}

interface Window {
	trackAlign: {
		appName: string
		inspectFolder: () => Promise<FolderInventory>
		rename: {
			apply: (items: Array<{ sourcePath: string; targetName: string }>) => Promise<{ id: string }>
			undoLatest: () => Promise<{ undone: true; id: string }>
		}
		spotify: {
			authenticate: () => Promise<{ authenticated: true }>
			loadCollection: (sourceUrl: string) => Promise<{ type: 'playlist' | 'album'; name: string; url: string; tracks: Array<{ position: number; artist: string; title: string; duration: string; durationMs?: number }> }>
		}
		window: {
			minimize: () => void
			toggleMaximize: () => void
			close: () => void
		}
	}
}
