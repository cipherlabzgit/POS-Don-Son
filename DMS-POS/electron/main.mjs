import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerSqliteIpc, closeSqliteDb } from './sqlite-ipc.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

/** @type {BrowserWindow | null} */
let mainWin = null

/** @type {{ apiBaseUrl?: string; configPath?: string } | null} */
let posConfig = null

function readPosConfig() {
  const candidates = []
  if (app.isPackaged) {
    candidates.push(path.join(path.dirname(process.execPath), 'pos-config.json'))
  }
  candidates.push(path.join(app.getPath('userData'), 'pos-config.json'))

  for (const configPath of candidates) {
    try {
      if (!fs.existsSync(configPath)) continue
      const raw = fs.readFileSync(configPath, 'utf8')
      const json = JSON.parse(raw)
      if (json && typeof json === 'object') {
        return { ...json, configPath }
      }
    } catch (err) {
      console.error('[pos-config] Failed to read', configPath, err)
    }
  }
  return null
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Don & Sons — POS',
    // Show maximised on startup (common for POS terminals)
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Prevent drag-drop navigation
      navigateOnDragDrop: false,
    },
  })

  // Inject a consistent Origin header on every outgoing request so the
  // ASP.NET CORS policy accepts requests from the packaged app (file:// origin
  // is sent as "null" by Chromium, which most CORS policies reject).
  mainWin.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'http://127.0.0.1:5174'
    callback({ requestHeaders: details.requestHeaders })
  })

  // Start maximised — POS terminals run full-screen
  mainWin.maximize()

  mainWin.once('ready-to-show', () => {
    mainWin.show()
  })

  mainWin.on('closed', () => {
    mainWin = null
  })

  // Block navigation away from app origin
  mainWin.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev
      ? process.env.VITE_DEV_SERVER_URL
      : `file://${path.join(__dirname, '../dist/index.html')}`
    if (!url.startsWith(appUrl)) event.preventDefault()
  })

  // External links → OS browser. Do not use shell.openExternal for about: URLs
  // (Windows shows “open this about link”); allow Electron to handle blank/popups.
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    const raw = (url || '').trim()
    const lower = raw.toLowerCase()
    if (!raw || lower === 'about:blank' || lower.startsWith('about:')) {
      return { action: 'allow' }
    }
    if (/^https?:\/\//i.test(raw) || raw.startsWith('mailto:')) {
      shell.openExternal(raw)
    }
    return { action: 'deny' }
  })

  if (isDev) {
    mainWin.loadURL(process.env.VITE_DEV_SERVER_URL)
    // Open DevTools in development
    mainWin.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWin.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─── IPC: app-level actions exposed to renderer via preload ───────────────────

ipcMain.handle('app:version', () => app.getVersion())

ipcMain.handle('app:get-config', () => posConfig)

ipcMain.handle('app:shutdown', async () => {
  if (!mainWin || mainWin.isDestroyed()) {
    app.quit()
    return
  }
  const { response } = await dialog.showMessageBox(mainWin, {
    type: 'question',
    buttons: ['Shutdown', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Shutdown POS',
    message: 'Are you sure you want to close the POS terminal?',
  })
  if (response === 0) app.quit()
})

ipcMain.handle('app:toggle-fullscreen', () => {
  if (!mainWin || mainWin.isDestroyed()) return
  if (mainWin.isFullScreen()) {
    mainWin.setFullScreen(false)
    mainWin.maximize()
  } else {
    mainWin.setFullScreen(true)
  }
})

ipcMain.handle('app:is-fullscreen', () => mainWin?.isFullScreen() ?? false)

ipcMain.handle('app:print-silent', async (_event, html) => {
  if (!mainWin || mainWin.isDestroyed()) {
    return { success: false, error: 'No main window' }
  }
  if (typeof html !== 'string' || !html.trim()) {
    return { success: false, error: 'Empty receipt' }
  }

  const tempPath = path.join(app.getPath('temp'), `dms-pos-receipt-${Date.now()}.html`)
  /** @type {BrowserWindow | null} */
  let printWin = null

  const cleanup = () => {
    try {
      if (printWin && !printWin.isDestroyed()) printWin.close()
    } catch {
      /* ignore */
    }
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    } catch {
      /* ignore */
    }
  }

  try {
    fs.writeFileSync(tempPath, html, 'utf8')

    // Visible (not hidden) window — on Windows, print dialogs from show:false
    // windows often never appear, so Print looks broken.
    printWin = new BrowserWindow({
      parent: mainWin,
      modal: true,
      show: false,
      width: 420,
      height: 720,
      autoHideMenuBar: true,
      title: 'Print Receipt',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })

    await printWin.loadFile(tempPath)
    printWin.show()
    printWin.focus()
    await new Promise((r) => setTimeout(r, 250))

    const result = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[ELECTRON-PRINT] Print dialog timed out')
        resolve({ success: false, error: 'Print dialog timed out' })
      }, 120_000)

      try {
        printWin.webContents.print(
          {
            silent: false,
            printBackground: true,
            color: false,
            margins: { marginType: 'printableArea' },
          },
          (success, failureReason) => {
            clearTimeout(timeout)
            const cancelled =
              !success &&
              /cancel/i.test(String(failureReason ?? ''))
            if (cancelled) {
              resolve({ success: true, cancelled: true })
              return
            }
            if (success) {
              resolve({ success: true })
              return
            }
            resolve({
              success: false,
              error: failureReason || 'Print failed',
            })
          },
        )
      } catch (printError) {
        clearTimeout(timeout)
        resolve({
          success: false,
          error: printError?.message || String(printError),
        })
      }
    })

    cleanup()
    return result
  } catch (error) {
    console.error('[ELECTRON-PRINT] Exception during print:', error)
    cleanup()
    return { success: false, error: error?.message || String(error) }
  }
})

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  posConfig = readPosConfig()
  if (posConfig?.configPath) {
    console.log('[pos-config] Loaded from', posConfig.configPath)
  }
  registerSqliteIpc()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  closeSqliteDb()
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.focus()
    }
  })
}
