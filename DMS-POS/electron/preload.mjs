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
  openCashDrawer: () => ipcRenderer.invoke('app:open-cash-drawer'),
  getDisplayStatus: () => ipcRenderer.invoke('display:status'),
  openCustomerDisplay: () => ipcRenderer.invoke('display:open-customer'),
  listComPorts: () => ipcRenderer.invoke('pole:list-ports'),
  getPoleConfig: () => ipcRenderer.invoke('pole:get-config'),
  setPolePort: (port) => ipcRenderer.invoke('pole:set-port', port),
  writePole: (line1, line2) => ipcRenderer.invoke('pole:write', { line1, line2 }),
  pushCustomerCart: (payload) => ipcRenderer.send('customer:push-cart', payload),
  onCustomerCart: (cb) => {
    const listener = (_event, payload) => cb(payload)
    ipcRenderer.on('customer:cart', listener)
    return () => ipcRenderer.removeListener('customer:cart', listener)
  },
  unlockBackstage: (password) => ipcRenderer.invoke('backstage:unlock', password),
  grantBackstageSession: () => ipcRenderer.invoke('backstage:grant-session'),
  lockBackstage: () => ipcRenderer.invoke('backstage:lock'),
  backstageStatus: () => ipcRenderer.invoke('backstage:status'),
  getSecureConfig: () => ipcRenderer.invoke('backstage:get-config'),
  saveSecureConfig: (payload) => ipcRenderer.invoke('backstage:save-config', payload),
  onBackstageHotkey: (cb) => {
    const listener = () => cb()
    ipcRenderer.on('app:backstage-hotkey', listener)
    return () => ipcRenderer.removeListener('app:backstage-hotkey', listener)
  },
})
