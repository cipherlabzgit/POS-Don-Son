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
