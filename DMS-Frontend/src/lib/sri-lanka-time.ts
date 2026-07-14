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
