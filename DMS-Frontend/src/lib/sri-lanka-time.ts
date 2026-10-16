/**
 * All user-visible dates/times in DMS are shown in Sri Lanka (Asia/Colombo, UTC+5:30).
 * API payloads remain ISO-8601 UTC; format at the UI layer with these helpers.
 */

export const DISPLAY_TIME_ZONE = 'Asia/Colombo';

function parseInput(input: string | number | Date | null | undefined): Date | null {
  if (input == null || input === '') return null;
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** yyyy-MM-dd for the calendar day of `input` in Sri Lanka (for date-only fields and anchors). */
export function formatCalendarDateInZone(
  input: string | number | Date,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  const d = parseInput(input);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatSlDate(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
): string {
  const d = parseInput(input);
  if (!d) return '—';
  return d.toLocaleDateString('en-LK', { ...options, timeZone: DISPLAY_TIME_ZONE });
}

const SL_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** dd/Mon/yyyy in Sri Lanka (Price Manager effective date column). */
export function formatSlDateSlashMon(input: string | number | Date | null | undefined): string {
  const cal = formatCalendarDateInZone(input ?? '');
  if (!cal) return '—';
  const [y, m, d] = cal.split('-');
  const mon = SL_MONTH_SHORT[Number(m) - 1];
  if (!mon || !d || !y) return cal;
  return `${d}/${mon}/${y}`;
}

/** yyyy-MM-dd for date inputs from an API instant (Sri Lanka calendar day). */
export function toDateInputValueInZone(
  input: string | number | Date | null | undefined,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  return formatCalendarDateInZone(input ?? '', timeZone);
}

export function formatSlDateTime(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
): string {
  const d = parseInput(input);
  if (!d) return '—';
  return d.toLocaleString('en-LK', { ...options, timeZone: DISPLAY_TIME_ZONE });
}

export function formatSlTime(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  },
): string {
  const d = parseInput(input);
  if (!d) return '—';
  return d.toLocaleTimeString('en-LK', { ...options, timeZone: DISPLAY_TIME_ZONE });
}
