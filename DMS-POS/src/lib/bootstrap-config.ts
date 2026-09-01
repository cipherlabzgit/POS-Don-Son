import { DEFAULT_API_BASE_URL, useSettingsStore } from './settings-store'
import { isLocalApiUrl, normalizeApiBaseUrl } from './api-url'

/** Apply server URL from Electron pos-config.json (field deployments). */
export async function applyBootstrapConfig(): Promise<void> {
  const getConfig = window.dmsPos?.getConfig
  if (!getConfig) return

  try {
    const cfg = await getConfig()
    const fromFile = cfg?.apiBaseUrl?.trim()
    if (fromFile) {
      useSettingsStore.getState().setApiBaseUrl(normalizeApiBaseUrl(fromFile))
      console.log('[bootstrap] API URL loaded from pos-config.json')
    }
    const showroomCode = (cfg as { showroomCode?: string } | null)?.showroomCode?.trim()
    if (showroomCode) {
      useSettingsStore.getState().setAssignedShowroomCode(showroomCode)
    }
  } catch (e) {
    console.warn('[bootstrap] Could not read pos-config.json', e)
  }
}

/**
 * If the POS was built for a remote server but localStorage still has localhost,
 * switch to the build-time default (VITE_API_URL).
 */
export function repairStaleLocalApiUrl(): void {
  const buildDefault = normalizeApiBaseUrl(DEFAULT_API_BASE_URL)
  if (isLocalApiUrl(buildDefault)) return

  const current = normalizeApiBaseUrl(useSettingsStore.getState().apiBaseUrl)
  if (isLocalApiUrl(current) && current !== buildDefault) {
    useSettingsStore.getState().setApiBaseUrl(buildDefault)
    console.log('[bootstrap] Replaced stale local API URL with build default')
  }
}
