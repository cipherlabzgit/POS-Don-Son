import { useEffect, useRef, useState } from 'react'
import { getApiBaseUrl } from './api'
import { refreshPendingLocalPosSaleStatuses } from './pos-sale-status-refresh'
import { processPendingQueue } from './sync-queue'
import { syncThemeFromServer } from './theme-sync'

const SYNC_DEBOUNCE_MS = 2000
/** Drain the queue every 60 s while the app is online (catches items that arrived without a reconnect event). */
const SYNC_INTERVAL_MS = 60_000
const HEALTH_INTERVAL_MS = 30_000
const HEALTH_TIMEOUT_MS = 8000

function runSyncThenRefreshLocalStatuses() {
  void Promise.all([
    syncThemeFromServer().catch(console.error),
    processPendingQueue(true).finally(() => {
      void refreshPendingLocalPosSaleStatuses({ limit: 100 })
    }),
  ])
}

async function pingServerHealth(): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return response.ok
  } catch {
    return false
  }
}

export function useOnlineStatus(authenticated: boolean): boolean {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine)
  const [serverReachable, setServerReachable] = useState(false)
  const online = browserOnline && serverReachable
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevOnline = useRef(false)

  // Track browser online/offline events
  useEffect(() => {
    const on = () => setBrowserOnline(true)
    const off = () => {
      setBrowserOnline(false)
      setServerReachable(false)
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Ping backend health — navigator.onLine alone is not enough (shows ONLINE while API is down)
  useEffect(() => {
    if (!authenticated) {
      setServerReachable(false)
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current)
        healthIntervalRef.current = null
      }
      return
    }

    let cancelled = false
    const check = async () => {
      const ok = await pingServerHealth()
      if (!cancelled) setServerReachable(ok)
    }

    void check()
    healthIntervalRef.current = setInterval(() => {
      void check()
    }, HEALTH_INTERVAL_MS)

    return () => {
      cancelled = true
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current)
        healthIntervalRef.current = null
      }
    }
  }, [authenticated])

  // Sync on window focus — user returns to the app after it was in background
  useEffect(() => {
    if (!authenticated) return
    const onFocus = () => {
      if (online) runSyncThenRefreshLocalStatuses()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [authenticated, online])

  // Reconnect debounce + periodic background sync
  useEffect(() => {
    if (!authenticated) {
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      prevOnline.current = false
      return
    }

    if (!online) {
      prevOnline.current = false
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }

    const wasOffline = !prevOnline.current
    prevOnline.current = true

    // Reconnect: debounce then sync
    if (wasOffline) {
      if (syncTimer.current) clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => {
        syncTimer.current = null
        runSyncThenRefreshLocalStatuses()
      }, SYNC_DEBOUNCE_MS)
    } else {
      // Already online (startup or authenticated state change): sync immediately
      runSyncThenRefreshLocalStatuses()
    }

    // Periodic background drain so queued items are not stuck until next reconnect
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (browserOnline && serverReachable) runSyncThenRefreshLocalStatuses()
      }, SYNC_INTERVAL_MS)
    }

    return () => {
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [online, authenticated, browserOnline, serverReachable])

  return online
}
