import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('trackAlign', {
  appName: 'TrackAlign',
})
