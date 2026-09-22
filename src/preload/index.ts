import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('trackAlign', {
  appName: 'TrackAlign',
  inspectFolder: () => ipcRenderer.invoke('folder:inspect'),
  spotify: {
    authenticate: () => ipcRenderer.invoke('spotify:authenticate'),
    loadCollection: (sourceUrl: string) => ipcRenderer.invoke('spotify:load-collection', sourceUrl),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
})
