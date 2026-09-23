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
		appVersion: () => Promise<string>
		inspectFolder: () => Promise<FolderInventory>
		refreshFolder: (folderPath: string) => Promise<FolderInventory>
		rename: {
			apply: (items: Array<{ sourcePath: string; targetName: string }>) => Promise<{ id: string }>
			undoLatest: () => Promise<{ undone: true; id: string }>
		}
		spotify: {
			authenticate: () => Promise<{ authenticated: true }>
			loadCollection: (sourceUrl: string) => Promise<{ type: 'playlist' | 'album'; name: string; url: string; tracks: Array<{ position: number; artist: string; title: string; album: string; year: number | null; duration: string; durationMs?: number }> }>
			search: (query: string, types: Array<'playlist' | 'album'>) => Promise<Array<{ type: 'playlist' | 'album'; id: string; name: string; subtitle: string; imageUrl?: string; url: string; trackCount: number }>>
			signOut: () => Promise<{ signedOut: true }>
			status: () => Promise<{ connected: boolean }>
		}
		github: {
			authStart: () => Promise<{ userCode: string; verificationUri: string }>
			onAuthStatus: (callback: (status: { connected: boolean; error?: string }) => void) => () => void
			status: () => Promise<{ connected: boolean }>
			signOut: () => Promise<{ signedOut: true }>
			submitIssue: (title: string, body: string) => Promise<{ number: number; htmlUrl: string }>
			listDiscussionCategories: () => Promise<Array<{ id: string; name: string; emoji: string }>>
			listDiscussions: (options?: { categoryId?: string; after?: string }) => Promise<{ discussions: Array<{ id: string; number: number; title: string; createdAt: string; authorLogin: string; commentCount: number }>; hasNextPage: boolean; endCursor: string | null }>
			getDiscussion: (number: number) => Promise<{ id: string; number: number; title: string; bodyHTML: string; createdAt: string; authorLogin: string; authorAvatarUrl?: string; comments: Array<{ id: string; bodyHTML: string; createdAt: string; authorLogin: string; authorAvatarUrl?: string }> }>
			createDiscussion: (categoryId: string, title: string, body: string) => Promise<{ id: string; number: number; url: string }>
			addDiscussionComment: (discussionId: string, body: string) => Promise<{ id: string }>
		}
		window: {
			minimize: () => Promise<boolean>
			toggleMaximize: () => Promise<boolean>
			close: () => Promise<boolean>
			toggleDevTools: () => Promise<boolean>
		}
		zoom: {
			set: (factor: number) => Promise<number>
			get: () => Promise<number>
		}
		shell: {
			openExternal: (url: string) => Promise<boolean>
		}
	}
}
