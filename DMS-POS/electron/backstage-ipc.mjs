import { ipcMain } from 'electron'
import {
  grantBackstageSession,
  isBackstageUnlocked,
  loadTillConfig,
  lockBackstage,
  saveTillConfig,
  verifyAdminKey,
} from './backstage-crypto.mjs'

export function registerBackstageIpc() {
  ipcMain.handle('backstage:unlock', (_event, password) => verifyAdminKey(password))
  ipcMain.handle('backstage:grant-session', () => grantBackstageSession())

  ipcMain.handle('backstage:lock', () => {
    lockBackstage()
    return { ok: true }
  })

  ipcMain.handle('backstage:status', () => ({
    unlocked: isBackstageUnlocked(),
  }))

  ipcMain.handle('backstage:get-config', () => loadTillConfig())

  ipcMain.handle('backstage:save-config', (_event, payload) => {
    try {
      const saved = saveTillConfig(payload ?? {})
      return { ok: true, config: saved }
    } catch (err) {
      return { ok: false, message: err?.message || String(err) }
    }
  })
}
