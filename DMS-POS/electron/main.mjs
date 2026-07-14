import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerSqliteIpc, closeSqliteDb } from './sqlite-ipc.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

/** @type {BrowserWindow | null} */
let mainWin = null

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
    details.requestHeaders['Origin'] = 'http://localhost:5173'
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

ipcMain.handle('app:print-silent', async (event, html) => {
  const log = (msg) => {
    console.log(msg)
    // Send logs to renderer console for debugging
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.executeJavaScript(`console.log("${msg.replace(/"/g, '\\"')}")`)
    }
  }
  
  log('[ELECTRON-PRINT] ========================================')
  log('[ELECTRON-PRINT] Print request received!')
  log('[ELECTRON-PRINT] HTML length: ' + (html?.length || 0))
  log('[ELECTRON-PRINT] Main window exists: ' + !!mainWin)
  log('[ELECTRON-PRINT] ========================================')
  
  if (!mainWin) {
    console.error('[ELECTRON-PRINT] No main window available')
    return { success: false, error: 'No main window' }
  }
  
  try {
    // Create a hidden window for printing
    const printWin = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    console.log('[ELECTRON-PRINT] Loading HTML into print window...')
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    
    // Wait for content to be ready
    await new Promise(resolve => {
      if (printWin.webContents.isLoading()) {
        printWin.webContents.once('did-finish-load', resolve)
      } else {
        resolve()
      }
    })

    console.log('[ELECTRON-PRINT] Content loaded, waiting 200ms for rendering...')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('[ELECTRON-PRINT] Opening print dialog...')
    return new Promise((resolve) => {
      // Set a timeout in case the print callback never fires
      const timeout = setTimeout(() => {
        console.error('[ELECTRON-PRINT] Print callback timeout - assuming user cancelled or print completed')
        try {
          printWin.close()
        } catch (e) {
          console.error('[ELECTRON-PRINT] Error closing window on timeout:', e)
        }
        resolve({ success: true }) // Assume success since dialog opened
      }, 60000) // 60 second timeout
      
      try {
        printWin.webContents.print(
          {
            silent: false,
            printBackground: true,
            color: false,
            margins: {
              marginType: 'none'
            },
            pageSize: 'A4'
          },
          (success, errorType) => {
            clearTimeout(timeout)
            console.log('[ELECTRON-PRINT] Print callback - success:', success, 'errorType:', errorType)
            
            setTimeout(() => {
              console.log('[ELECTRON-PRINT] Closing print window')
              try {
                if (!printWin.isDestroyed()) {
                  printWin.close()
                }
              } catch (e) {
                console.error('[ELECTRON-PRINT] Error closing window:', e)
              }
            }, 100)
            
            if (success) {
              console.log('[ELECTRON-PRINT] Print completed successfully')
              resolve({ success: true })
            } else {
              console.error('[ELECTRON-PRINT] Print failed with error:', errorType)
              resolve({ success: false, error: errorType || 'Print cancelled or failed' })
            }
          }
        )
        console.log('[ELECTRON-PRINT] Print method called, waiting for callback...')
      } catch (printError) {
        clearTimeout(timeout)
        console.error('[ELECTRON-PRINT] Exception calling print method:', printError)
        try {
          printWin.close()
        } catch (e) {
          // ignore
        }
        resolve({ success: false, error: printError.message })
      }
    })
  } catch (error) {
    console.error('[ELECTRON-PRINT] Exception during print:', error)
    return { success: false, error: error.message }
  }
})

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
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
