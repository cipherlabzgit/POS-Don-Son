/** Sri Lanka business calendar (same zone as DMS web). */
const DISPLAY_TIME_ZONE = 'Asia/Colombo'

/** `yyyy-MM-dd` for today in Asia/Colombo — do not use `toISOString().slice(0, 10)`. */
export function todayCalendarISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Milliseconds until the next Asia/Colombo midnight (00:00). Sri Lanka has no DST. */
export function msUntilNextColomboMidnight(now: Date = new Date()): number {
  const today = todayCalendarISO(now)
  const startOfToday = new Date(`${today}T00:00:00+05:30`)
  const nextMidnight = startOfToday.getTime() + 24 * 60 * 60 * 1000
  return Math.max(250, nextMidnight - now.getTime())
}
