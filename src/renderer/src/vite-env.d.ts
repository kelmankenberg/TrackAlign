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
	}
}
