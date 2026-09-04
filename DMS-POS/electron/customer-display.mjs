import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {BrowserWindow | null} */
let customerWin = null

export function getDisplayStatus() {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find((d) => d.id !== primary.id) ?? null
  return {
    secondaryAvailable: Boolean(secondary),
    primaryId: primary.id,
    displays: displays.map((d) => ({
      id: d.id,
      primary: d.id === primary.id,
      bounds: d.bounds,
    })),
  }
}

function loadCustomerUrl(win, isDev) {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}#customer-display`)
    return
  }
  win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'customer-display' })
}

export function closeCustomerDisplay() {
  if (customerWin && !customerWin.isDestroyed()) {
    customerWin.close()
  }
  customerWin = null
}

export function sendCustomerCart(payload) {
  if (customerWin && !customerWin.isDestroyed()) {
    customerWin.webContents.send('customer:cart', payload)
  }
}

export function openCustomerDisplay({ isDev, icon, preload }) {
  const status = getDisplayStatus()
  if (!status.secondaryAvailable) {
    return { ok: false, reason: 'no-secondary' }
  }
  const primary = screen.getPrimaryDisplay()
  const secondary = screen.getAllDisplays().find((d) => d.id !== primary.id)
  if (!secondary) return { ok: false, reason: 'no-secondary' }

  if (customerWin && !customerWin.isDestroyed()) {
    customerWin.setBounds(secondary.bounds)
    customerWin.setFullScreen(true)
    customerWin.show()
    return { ok: true, reused: true }
  }

  customerWin = new BrowserWindow({
    x: secondary.bounds.x,
    y: secondary.bounds.y,
    width: secondary.bounds.width,
    height: secondary.bounds.height,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    title: 'Don & Sons — Customer Display',
    icon,
    show: false,
    backgroundColor: '#c8102e',
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: false,
    },
  })

  customerWin.setMenu(null)
  customerWin.webContents.on('devtools-opened', () => {
    customerWin.webContents.closeDevTools()
  })
  customerWin.once('ready-to-show', () => {
    customerWin.setBounds(secondary.bounds)
    customerWin.setFullScreen(true)
    customerWin.show()
  })
  customerWin.on('closed', () => {
    customerWin = null
  })

  customerWin.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'http://127.0.0.1:5174'
    callback({ requestHeaders: details.requestHeaders })
  })

  loadCustomerUrl(customerWin, isDev)
  return { ok: true, reused: false }
}

export function syncCustomerDisplay({ isDev, icon, preload }) {
  const status = getDisplayStatus()
  if (status.secondaryAvailable) {
    return openCustomerDisplay({ isDev, icon, preload })
  }
  closeCustomerDisplay()
  return { ok: false, reason: 'no-secondary' }
}
