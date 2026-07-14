import { useEffect, useRef, useState } from 'react'
import { refreshPendingLocalPosSaleStatuses } from './pos-sale-status-refresh'
import { processPendingQueue } from './sync-queue'
import { syncThemeFromServer } from './theme-sync'

const SYNC_DEBOUNCE_MS = 2000
/** Drain the queue every 60 s while the app is online (catches items that arrived without a reconnect event). */
const SYNC_INTERVAL_MS = 60_000

function runSyncThenRefreshLocalStatuses() {
  void Promise.all([
    syncThemeFromServer().catch(console.error),
    processPendingQueue(true).finally(() => {
      void refreshPendingLocalPosSaleStatuses({ limit: 100 })
    })
  ])
}

export function useOnlineStatus(authenticated: boolean): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevOnline = useRef(navigator.onLine)

  // Track browser online/offline events
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Sync on window focus — user returns to the app after it was in background
  useEffect(() => {
    if (!authenticated) return
    const onFocus = () => {
      if (navigator.onLine) runSyncThenRefreshLocalStatuses()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [authenticated])

  // Reconnect debounce + periodic background sync
  useEffect(() => {
    if (!authenticated) {
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
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
        if (navigator.onLine) runSyncThenRefreshLocalStatuses()
      }, SYNC_INTERVAL_MS)
    }

    return () => {
      if (syncTimer.current) { clearTimeout(syncTimer.current); syncTimer.current = null }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [online, authenticated])

  return online
}
