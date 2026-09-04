import { app, BrowserWindow, Menu, ipcMain, shell, dialog, screen } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerSqliteIpc, closeSqliteDb } from './sqlite-ipc.mjs'
import { registerBackstageIpc } from './backstage-ipc.mjs'
import { loadTillConfig, migrateLegacyIfNeeded } from './backstage-crypto.mjs'
import { openCashDrawer } from './cash-drawer.mjs'
import {
  getDisplayStatus,
  openCustomerDisplay,
  sendCustomerCart,
  syncCustomerDisplay,
  closeCustomerDisplay,
} from './customer-display.mjs'
import {
  listComPorts,
  loadPoleConfig,
  savePoleConfig,
  writePoleFromCart,
  writePoleLines,
} from './pole-display.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

/** @type {BrowserWindow | null} */
let mainWin = null

/** @type {{ apiBaseUrl?: string; posVerificationCode?: string; showroomCode?: string; configPath?: string; encrypted?: boolean } | null} */
let posConfig = null

function publicPosConfig() {
  if (!posConfig) return null
  return {
    apiBaseUrl: posConfig.apiBaseUrl,
    posVerificationCode: posConfig.posVerificationCode,
    showroomCode: posConfig.showroomCode,
    showroomPublicCode: posConfig.showroomCode,
    configPath: posConfig.configPath,
    encrypted: Boolean(posConfig.encrypted),
  }
}

function resolveWindowIcon() {
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../public/icon.png'),
    path.join(process.resourcesPath || '', 'icon.ico'),
  ]
  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate
    } catch {
      /* ignore missing icon */
    }
  }
  return undefined
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Don & Sons — POS',
    icon: resolveWindowIcon(),
    fullscreen: true,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: false,
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

  mainWin.setMenu(null)
  mainWin.setMenuBarVisibility(false)
  mainWin.setFullScreen(true)

  mainWin.webContents.on('devtools-opened', () => {
    mainWin.webContents.closeDevTools()
  })
  mainWin.webContents.on('context-menu', (event) => {
    event.preventDefault()
  })
  mainWin.webContents.on('before-input-event', (event, input) => {
    const key = (input.key || '').toLowerCase()
    const ctrl = input.control || input.meta
    const shift = input.shift
    if (ctrl && shift && key === 'a') {
      event.preventDefault()
      mainWin.webContents.send('app:backstage-hotkey')
      return
    }
    const blocked =
      key === 'f12' ||
      (ctrl && key === 'r') ||
      (ctrl && shift && (key === 'i' || key === 'j' || key === 'c' || key === 'r')) ||
      (ctrl && key === 'u')
    if (blocked) event.preventDefault()
  })

  mainWin.once('ready-to-show', () => {
    const iconPath = resolveWindowIcon()
    if (iconPath) mainWin.setIcon(iconPath)
    mainWin.setFullScreen(true)
    mainWin.show()
  })

  mainWin.on('closed', () => {
    mainWin = null
    closeCustomerDisplay()
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
  } else {
    mainWin.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─── IPC: app-level actions exposed to renderer via preload ───────────────────

ipcMain.handle('app:version', () => app.getVersion())

ipcMain.handle('app:get-config', () => {
  posConfig = loadTillConfig()
  return publicPosConfig()
})

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

ipcMain.handle('display:status', () => getDisplayStatus())
ipcMain.handle('display:open-customer', () =>
  openCustomerDisplay({
    isDev,
    icon: resolveWindowIcon(),
    preload: path.join(__dirname, 'preload.mjs'),
  }),
)
ipcMain.handle('pole:list-ports', () => listComPorts())
ipcMain.handle('pole:get-config', () => loadPoleConfig())
ipcMain.handle('pole:set-port', (_event, port) => savePoleConfig(port))
ipcMain.handle('pole:write', (_event, payload) =>
  writePoleLines(payload?.line1 ?? '', payload?.line2 ?? ''),
)
ipcMain.on('customer:push-cart', (_event, payload) => {
  sendCustomerCart(payload)
  void writePoleFromCart(payload)
})

ipcMain.handle('app:open-cash-drawer', async () => {
  try {
    return await openCashDrawer()
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  }
})

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
    await new Promise((r) => setTimeout(r, 200))

    const result = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[ELECTRON-PRINT] Print dialog timed out')
        resolve({ success: false, error: 'Print dialog timed out' })
      }, 120_000)

      try {
        printWin.webContents.print(
          {
            silent: true,
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

app.setName('Don & Sons POS')
if (process.platform === 'win32') {
  app.setAppUserModelId('com.donandsons.dms-pos')
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  posConfig = migrateLegacyIfNeeded() ?? loadTillConfig()
  if (posConfig?.configPath) {
    console.log('[pos-config] Loaded from', posConfig.configPath, posConfig.encrypted ? '(encrypted)' : '(legacy)')
  }
  registerBackstageIpc()
  registerSqliteIpc()
  createMainWindow()

  const customerOpts = () => ({
    isDev,
    icon: resolveWindowIcon(),
    preload: path.join(__dirname, 'preload.mjs'),
  })
  syncCustomerDisplay(customerOpts())
  screen.on('display-added', () => syncCustomerDisplay(customerOpts()))
  screen.on('display-removed', () => syncCustomerDisplay(customerOpts()))

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
