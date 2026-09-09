import { useEffect, useState } from 'react'
import { msUntilNextColomboMidnight, todayCalendarISO } from './calendar-date'

/**
 * Colombo business date (`yyyy-MM-dd`). Updates automatically at 00:00 Asia/Colombo
 * so POS day-scoped screens reset without a manual refresh.
 */
export function useSriLankaBusinessDay(): string {
  const [day, setDay] = useState(() => todayCalendarISO())

  useEffect(() => {
    let timeoutId = 0

    const sync = () => {
      const next = todayCalendarISO()
      setDay((prev) => (prev === next ? prev : next))
    }

    const scheduleMidnight = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        sync()
        scheduleMidnight()
      }, msUntilNextColomboMidnight())
    }

    scheduleMidnight()
    const intervalId = window.setInterval(sync, 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return day
}
