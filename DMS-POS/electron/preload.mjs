import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('dmsPos', {
  mode: 'electron',
  getVersion: () => ipcRenderer.invoke('app:version'),
  getConfig: () => ipcRenderer.invoke('app:get-config'),
  shutdown: () => ipcRenderer.invoke('app:shutdown'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('app:is-fullscreen'),
  /** Whitelisted offline SQLite ops (see electron/sqlite-ipc.mjs) */
  sqliteOp: (op, payload) => ipcRenderer.invoke('offline:op', { op, payload }),
  /** Silent print HTML content without showing print dialog */
  printSilent: (html) => ipcRenderer.invoke('app:print-silent', html),
})
