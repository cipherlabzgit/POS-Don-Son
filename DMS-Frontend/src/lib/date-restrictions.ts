import { DISPLAY_TIME_ZONE, formatCalendarDateInZone } from './sri-lanka-time';

/**
 * Date Restriction Utilities for DMS Operations
 *
 * Per Don & Sons DMS Requirements (sections 4.i - 4.vii):
 * - Admin / Super Admin: Can see all records, can pick any date
 * - Permission-allowed users (Manager): May be granted back/future date access
 * - Other users: Restricted by operation type
 *
 * Restriction profiles:
 *  - "delivery": Users without both back-date and future-date grants use the current
 *    date and time only on create; users with both grants (or admin) may pick any time.
 *  - "today-only": Today only (Disposal, Daily Production, Production Cancel)
 *  - "back-3-no-future": Back date up to 3 days, NO future date
 *    (Transfer, Stock BF, Cancellation, Delivery Return)
 *  - "label-print": No back/future for normal users (Today only); If item allows
 *    Today+, show field as Yellow
 */

export type DateRestrictionProfile =
  | 'delivery'
  | 'today-only'
  | 'back-3-no-future'
  | 'label-print'
  | 'future-only-3';

export interface UserContext {
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  permissions?: string[];
}

export function todayISO(): string {
  return formatCalendarDateInZone(new Date(), DISPLAY_TIME_ZONE);
}

/** Local `datetime-local` value for the current clock (minute resolution). */
export function nowDateTimeLocalValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDaysISO(days: number): string {
  const base = todayISO();
  const [y, m, d] = base.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return formatCalendarDateInZone(anchor, DISPLAY_TIME_ZONE);
}

/** Previous calendar day in Sri Lanka (Asia/Colombo), for day-end / cashier balance defaults. */
export function previousCalendarDayUtcISO(): string {
  return addDaysISO(-1);
}

export function isAdminUser(user: UserContext | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.isAdmin) return true;
  if (user.permissions?.includes('*')) return true;
  return false;
}

/**
 * Describe the helper-text outcome of an independent (back-date, future-date)
 * permission pair. `defaultText` is shown when neither grant applies — i.e.
 * the profile's default date window is in effect.
 */
function describeGrant(
  allowBack: boolean | string | undefined,
  allowFuture: boolean | string | undefined,
  defaultText: string
): string {
  if (allowBack && allowFuture) return 'Back and future dates allowed (granted)';
  if (allowBack) return 'Back dates allowed (granted). Future dates restricted.';
  if (allowFuture) return 'Future dates allowed (granted). Back dates restricted.';
  return defaultText;
}

export interface DateBoundsResult {
  min?: string;
  max?: string;
  helperText?: string;
  /**
   * When true, the delivery date/time field is read-only and must reflect the current
   * moment (new deliveries). Users need both allow-back-date and allow-future-date
   * grants (or admin) to edit the calendar freely.
   */
  lockToNow?: boolean;
}

/**
 * Compute min/max date constraints for a date input based on user role and
 * operation profile. Admin (or permission-allowed) gets full freedom.
 */
export function getDateBounds(
  profile: DateRestrictionProfile,
  user: UserContext | null | undefined,
  options?: { allowBackDatePermission?: string; allowFutureDatePermission?: string }
): DateBoundsResult {
  const today = todayISO();
  const isAdmin = isAdminUser(user);
  const allowBack =
    isAdmin ||
    (options?.allowBackDatePermission &&
      user?.permissions?.includes(options.allowBackDatePermission));
  const allowFuture =
    isAdmin ||
    (options?.allowFutureDatePermission &&
      user?.permissions?.includes(options.allowFutureDatePermission));

  switch (profile) {
    case 'delivery': {
      const unrestricted =
        isAdmin ||
        (Boolean(options?.allowBackDatePermission && user?.permissions?.includes(options.allowBackDatePermission)) &&
          Boolean(
            options?.allowFutureDatePermission &&
              user?.permissions?.includes(options.allowFutureDatePermission)
          ));
      if (unrestricted) {
        return {
          min: undefined,
          max: undefined,
          helperText: isAdmin
            ? 'Admin: any date and time allowed'
            : 'Back and future dates allowed (granted)',
          lockToNow: false,
        };
      }
      if (!allowBack && !allowFuture) {
        return {
          min: undefined,
          max: undefined,
          helperText:
            'Date and time are set to the current moment. Changing them requires back-date and future-date permissions.',
          lockToNow: true,
        };
      }
      if (allowBack && !allowFuture) {
        return {
          min: undefined,
          max: today,
          helperText: describeGrant(allowBack, allowFuture, 'Future calendar days are not allowed.'),
          lockToNow: false,
        };
      }
      // Future grant only: no back-dating
      return {
        min: today,
        max: undefined,
        helperText: describeGrant(allowBack, allowFuture, 'Past calendar days are not allowed.'),
        lockToNow: false,
      };
    }
    case 'today-only':
      return {
        min: allowBack ? undefined : today,
        max: allowFuture ? undefined : today,
        helperText: isAdmin
          ? 'Admin: any date allowed'
          : describeGrant(allowBack, allowFuture, 'Only today is allowed'),
      };
    case 'back-3-no-future':
      // No future date. Back date allowed up to 3 days for normal users.
      return {
        min: allowBack ? undefined : addDaysISO(-3),
        max: allowFuture ? undefined : today,
        helperText: isAdmin
          ? 'Admin: any date allowed'
          : describeGrant(
              allowBack,
              allowFuture,
              'Back date allowed up to 3 days. Future dates are not allowed.'
            ),
      };
    case 'label-print':
      // Default: today only for normal users
      return {
        min: allowBack ? undefined : today,
        max: allowFuture ? undefined : today,
        helperText: isAdmin
          ? 'Admin: any date allowed'
          : describeGrant(allowBack, allowFuture, 'Only today is allowed'),
      };
    case 'future-only-3':
      // Delivery Plan (6.vi): only future date, max 3 days ahead
      return {
        min: addDaysISO(1),
        max: addDaysISO(3),
        helperText: 'Future dates only (max 3 days ahead).',
      };
    default:
      return {};
  }
}

/**
 * Filter a list of records based on user role.
 * Admin/Super Admin: all records
 * Other users: only records they created today (or today+ for delivery)
 */
export function filterRecordsByRole<
  T extends { editUser?: string; createdBy?: string; deliveryDate?: string; transferDate?: string; date?: string }
>(
  records: T[],
  user: { username?: string; isSuperAdmin?: boolean; isAdmin?: boolean } | null | undefined,
  options?: { allowFutureForOwner?: boolean }
): T[] {
  if (!user) return [];
  if (user.isSuperAdmin || user.isAdmin) return records;

  const today = todayISO();
  return records.filter((r) => {
    const owner = r.editUser ?? r.createdBy;
    if (owner !== user.username) return false;
    const date = r.deliveryDate ?? r.transferDate ?? r.date;
    if (!date) return true;
    if (options?.allowFutureForOwner) return date >= today;
    return date === today;
  });
}
