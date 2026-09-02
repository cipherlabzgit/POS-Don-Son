import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../lib/auth-store'
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS, subscribeActivity } from '../lib/idle-session'
import { toast } from '../lib/toast-store'

export function useIdleLogout(enabled: boolean) {
  const logout = useAuthStore((s) => s.logout)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const lastActivityRef = useRef(Date.now())

  const bump = useCallback(() => {
    lastActivityRef.current = Date.now()
    setSecondsLeft(null)
  }, [])

  const signOutIdle = useCallback(() => {
    logout()
    toast('Signed out after 2 hours of inactivity. Please sign in again.', 'info')
  }, [logout])

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(null)
      return
    }

    lastActivityRef.current = Date.now()
    const off = subscribeActivity(bump)

    const tick = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs >= IDLE_TIMEOUT_MS) {
        signOutIdle()
        return
      }
      const remaining = IDLE_TIMEOUT_MS - idleMs
      if (remaining <= IDLE_WARNING_MS) {
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)))
      } else {
        setSecondsLeft(null)
      }
    }, 1000)

    return () => {
      off()
      window.clearInterval(tick)
    }
  }, [enabled, bump, signOutIdle])

  return {
    warning: secondsLeft != null,
    secondsLeft: secondsLeft ?? 0,
    staySignedIn: bump,
    logoutNow: signOutIdle,
  }
}
