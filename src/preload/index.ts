import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('trackAlign', {
  appName: 'TrackAlign',
  inspectFolder: () => ipcRenderer.invoke('folder:inspect'),
  refreshFolder: (folderPath: string) => ipcRenderer.invoke('folder:refresh', folderPath),
  rename: {
    apply: (items: Array<{ sourcePath: string; targetName: string }>) => ipcRenderer.invoke('rename:apply', items),
    undoLatest: () => ipcRenderer.invoke('rename:undo-latest'),
  },
  spotify: {
    authenticate: () => ipcRenderer.invoke('spotify:authenticate'),
    loadCollection: (sourceUrl: string) => ipcRenderer.invoke('spotify:load-collection', sourceUrl),
    search: (query: string, types: Array<'playlist' | 'album'>) => ipcRenderer.invoke('spotify:search', query, types),
    signOut: () => ipcRenderer.invoke('spotify:sign-out'),
    status: () => ipcRenderer.invoke('spotify:status'),
  },
  github: {
    authStart: () => ipcRenderer.invoke('github:auth-start'),
    onAuthStatus: (callback: (status: { connected: boolean; error?: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: { connected: boolean; error?: string }) => callback(status)
      ipcRenderer.on('github:auth-status', listener)
      return () => ipcRenderer.removeListener('github:auth-status', listener)
    },
    status: () => ipcRenderer.invoke('github:status'),
    signOut: () => ipcRenderer.invoke('github:sign-out'),
    submitIssue: (title: string, body: string) => ipcRenderer.invoke('github:submit-issue', title, body),
    listDiscussionCategories: () => ipcRenderer.invoke('github:list-discussion-categories'),
    listDiscussions: (options?: { categoryId?: string; after?: string }) => ipcRenderer.invoke('github:list-discussions', options ?? {}),
    getDiscussion: (number: number) => ipcRenderer.invoke('github:get-discussion', number),
    createDiscussion: (categoryId: string, title: string, body: string) => ipcRenderer.invoke('github:create-discussion', categoryId, title, body),
    addDiscussionComment: (discussionId: string, body: string) => ipcRenderer.invoke('github:add-discussion-comment', discussionId, body),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),
  },
  zoom: {
    set: (factor: number) => ipcRenderer.invoke('zoom:set', factor),
    get: () => ipcRenderer.invoke('zoom:get'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
})
