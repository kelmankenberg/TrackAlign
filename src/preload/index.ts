import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('trackAlign', {
  appName: 'TrackAlign',
  inspectFolder: () => ipcRenderer.invoke('folder:inspect'),
})
