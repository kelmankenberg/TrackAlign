import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('trackAlign', {
  appName: 'TrackAlign',
  inspectFolder: () => ipcRenderer.invoke('folder:inspect'),
  rename: {
    apply: (items: Array<{ sourcePath: string; targetName: string }>) => ipcRenderer.invoke('rename:apply', items),
    undoLatest: () => ipcRenderer.invoke('rename:undo-latest'),
  },
  spotify: {
    authenticate: () => ipcRenderer.invoke('spotify:authenticate'),
    loadCollection: (sourceUrl: string) => ipcRenderer.invoke('spotify:load-collection', sourceUrl),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),
  },
})
