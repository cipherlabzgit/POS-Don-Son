import { fetchActivePosTheme } from './api'
import { useSettingsStore } from './settings-store'

/**
 * Fetch the active POS theme from the backend and apply it.
 * This should be called when the app starts and when coming back online.
 */
export async function syncThemeFromServer(): Promise<void> {
  try {
    const theme = await fetchActivePosTheme()
    useSettingsStore.getState().setThemeColors(theme)
    console.log('[theme-sync] Theme synchronized from server:', theme)
  } catch (err) {
    console.warn('[theme-sync] Failed to fetch theme, using defaults:', err)
    // Don't show error toast, just use default colors
    // The app will continue with the hardcoded CSS defaults
  }
}
