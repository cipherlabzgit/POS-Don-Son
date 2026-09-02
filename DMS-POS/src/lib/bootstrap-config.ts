import { DEFAULT_API_BASE_URL, useSettingsStore } from './settings-store'
import { isLocalApiUrl, normalizeApiBaseUrl } from './api-url'

/** Apply server URL and showroom code from the encrypted till config. */
export async function applyBootstrapConfig(): Promise<void> {
  const getConfig = window.dmsPos?.getConfig
  if (!getConfig) return

  try {
    const cfg = await getConfig()
    const fromFile = cfg?.apiBaseUrl?.trim()
    if (fromFile) {
      useSettingsStore.getState().setApiBaseUrl(normalizeApiBaseUrl(fromFile))
      console.log('[bootstrap] API URL loaded from encrypted till config')
    }
    const verify = (cfg?.posVerificationCode || '').trim()
    const maybeCode = (cfg?.showroomCode || '').trim()
    if (verify) {
      useSettingsStore.getState().setAssignedShowroomCode(verify)
      useSettingsStore.getState().setAssignedShowroomPublicCode(
        (cfg?.showroomPublicCode || maybeCode || '').trim(),
      )
    } else if (maybeCode) {
      useSettingsStore.getState().setAssignedShowroomCode(maybeCode)
    }
  } catch (e) {
    console.warn('[bootstrap] Could not read encrypted till config', e)
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
