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
    signOut: () => ipcRenderer.invoke('spotify:sign-out'),
    status: () => ipcRenderer.invoke('spotify:status'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),
  },
})
