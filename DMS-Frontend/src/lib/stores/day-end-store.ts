import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Day End Process Store
 * 
 * Tracks the last submitted Day-End Process date.
 * This date is used across the system for:
 * - Reports: Can only generate reports for dates AFTER this date
 * - Operations: Various date restrictions based on last day-end
 */

interface DayEndStore {
  lastDayEndProcessDate: string | null;
  setLastDayEndProcessDate: (date: string | null) => void;
  /** First calendar day allowed for reports after last day-end, or `null` if none recorded. */
  getMinReportDate: () => string | null;
}

export const useDayEndStore = create<DayEndStore>()(
  persist(
    (set, get) => ({
      lastDayEndProcessDate: null,

      setLastDayEndProcessDate: (date: string | null) => {
        set({ lastDayEndProcessDate: date });
      },

      /**
       * Returns the minimum date allowed for report generation when a day-end floor applies.
       * This is the day AFTER the last Day-End Process date.
       * When no day-end has been run, returns `null` (no floor — UI applies permissions separately).
       */
      getMinReportDate: () => {
        const lastDate = get().lastDayEndProcessDate;
        if (!lastDate) return null;

        const d = new Date(lastDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      },
    }),
    {
      name: 'dms-day-end-storage',
    }
  )
);
