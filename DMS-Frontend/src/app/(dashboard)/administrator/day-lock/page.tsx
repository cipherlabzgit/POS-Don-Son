'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Lock, Unlock, ChevronLeft, ChevronRight, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';
import { dayLockApi } from '@/lib/api/day-lock';

const SL_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function todaySL(): { y: number; m: number; d: number } {
  const now = new Date(Date.now() + SL_OFFSET_MS);
  return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getDayOfWeek(y: number, m: number, d: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(y, m - 1, d);
  return days[date.getDay()];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function DayLockPage() {
  const sl = todaySL();
  const [year, setYear] = useState(sl.y);
  const [month, setMonth] = useState(sl.m); // 1-12
  const [lockedDates, setLockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [lockingAll, setLockingAll] = useState(false);

  const loadLockedDates = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const from = toIso(y, m, 1);
      const daysInMonth = new Date(y, m, 0).getDate();
      const to = toIso(y, m, daysInMonth);
      const dates = await dayLockApi.getLockedDates(from, to);
      setLockedDates(new Set(dates.map((d) => d.slice(0, 10))));
    } catch {
      toast.error('Failed to load locked dates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLockedDates(year, month);
  }, [year, month, loadLockedDates]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const goToToday = () => {
    const today = todaySL();
    setYear(today.y);
    setMonth(today.m);
    setSelectedDate(today);
  };

  const handleDayClick = (day: number) => {
    setSelectedDate({ y: year, m: month, d: day });
  };

  const handleToggleLock = async () => {
    if (!selectedDate) return;

    const dateStr = toIso(selectedDate.y, selectedDate.m, selectedDate.d);
    const isLocked = lockedDates.has(dateStr);
    const action = isLocked ? 'unlock' : 'lock';

    if (!window.confirm(`${action === 'lock' ? 'Lock' : 'Unlock'} ${dateStr}? ${action === 'lock' ? 'No entries will be allowed for this date once locked.' : 'Entries will be allowed again for this date.'}`)) {
      return;
    }

    setToggling(dateStr);
    try {
      if (isLocked) {
        await dayLockApi.unlockDate(dateStr);
        setLockedDates((prev) => { const next = new Set(prev); next.delete(dateStr); return next; });
        toast.success(`${dateStr} unlocked.`);
      } else {
        await dayLockApi.lockDate(dateStr);
        setLockedDates((prev) => new Set([...prev, dateStr]));
        toast.success(`${dateStr} locked.`);
      }
    } catch {
      toast.error(`Failed to ${action} ${dateStr}.`);
    } finally {
      setToggling(null);
    }
  };

  const handleLockAllPreviousDays = async () => {
    const today = todaySL();
    const todayDate = new Date(today.y, today.m - 1, today.d);
    
    if (!window.confirm('Lock all previous days? This will lock all dates before today. No entries will be allowed for these dates.')) {
      return;
    }

    setLockingAll(true);
    try {
      const datesToLock: string[] = [];
      
      // Lock all days from a reasonable past date to yesterday
      const startDate = new Date(today.y - 1, 0, 1); // Start from 1 year ago
      const currentDate = new Date(startDate);
      
      while (currentDate < todayDate) {
        const dateStr = toIso(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate()
        );
        
        // Only lock if not already locked
        if (!lockedDates.has(dateStr)) {
          datesToLock.push(dateStr);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Lock dates in batches
      let successCount = 0;
      let failCount = 0;
      
      for (const dateStr of datesToLock) {
        try {
          await dayLockApi.lockDate(dateStr);
          setLockedDates((prev) => new Set([...prev, dateStr]));
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully locked ${successCount} previous day${successCount !== 1 ? 's' : ''}.`);
      }
      if (failCount > 0) {
        toast.error(`Failed to lock ${failCount} day${failCount !== 1 ? 's' : ''}.`);
      }

      // Reload locked dates for current month
      await loadLockedDates(year, month);
    } catch (error) {
      toast.error('Failed to lock previous days.');
    } finally {
      setLockingAll(false);
    }
  };

  // Build calendar grid (Sun-start to match screenshot)
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const { y: todayY, m: todayM, d: todayD } = todaySL();

  // Calculate stats
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const lockedInMonth = Array.from(lockedDates).filter(d => {
    const [y, m] = d.split('-').map(Number);
    return y === year && m === month;
  }).length;
  const unlockedInMonth = daysInCurrentMonth - lockedInMonth;

  const selectedDateStr = selectedDate ? toIso(selectedDate.y, selectedDate.m, selectedDate.d) : null;
  const isSelectedLocked = selectedDateStr ? lockedDates.has(selectedDateStr) : false;

  return (
    <ProtectedPage permission="admin:day-lock">
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <div className="bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#10B981' }}
              >
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Day Lock</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Lock or unlock daily operations for all showrooms.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Lock Scope */}
            <div className="rounded-lg shadow-sm" style={{ backgroundColor: '#D1FAE5' }}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#065F46' }}>LOCK SCOPE</p>
                    <h3 className="text-lg font-bold mb-0.5" style={{ color: '#047857' }}>All Showrooms</h3>
                    <p className="text-xs" style={{ color: '#059669' }}>Applies to all date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Days */}
            <div className="rounded-lg shadow-sm" style={{ backgroundColor: '#FEE2E2' }}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#991B1B' }}>LOCKED DAYS</p>
                    <h3 className="text-2xl font-bold mb-0.5" style={{ color: '#DC2626' }}>{lockedInMonth}</h3>
                    <p className="text-xs" style={{ color: '#EF4444' }}>This month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlocked Days */}
            <div className="rounded-lg shadow-sm" style={{ backgroundColor: '#DBEAFE' }}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#1E3A8A' }}>UNLOCKED DAYS</p>
                    <h3 className="text-2xl font-bold mb-0.5" style={{ color: '#2563EB' }}>{unlockedInMonth}</h3>
                    <p className="text-xs" style={{ color: '#3B82F6' }}>Ready for data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={prevMonth}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        color: '#374151',
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
                      {MONTH_NAMES[month - 1]} {year}
                    </h2>

                    <div className="flex gap-2">
                      <button
                        onClick={handleLockAllPreviousDays}
                        disabled={loading || lockingAll}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                        style={{
                          backgroundColor: lockingAll ? '#FEE2E2' : '#DC2626',
                          border: '1px solid #DC2626',
                          color: 'white',
                        }}
                      >
                        {lockingAll ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Locking...
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            Lock Previous
                          </>
                        )}
                      </button>
                      <button
                        onClick={goToToday}
                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          color: '#374151',
                        }}
                      >
                        Today
                      </button>
                      <button
                        onClick={nextMonth}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          color: '#374151',
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
                      {/* Day headers */}
                      <div className="grid grid-cols-7" style={{ backgroundColor: '#F9FAFB' }}>
                        {DAY_NAMES.map((day) => (
                          <div
                            key={day}
                            className="py-2 text-center text-xs font-semibold"
                            style={{ color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar days */}
                      <div className="grid grid-cols-7">
                        {cells.map((day, idx) => {
                          if (day === null) {
                            return (
                              <div
                                key={`empty-${idx}`}
                                className="border-b border-r"
                                style={{
                                  height: '50px',
                                  borderColor: '#E5E7EB',
                                  backgroundColor: '#F9FAFB',
                                }}
                              />
                            );
                          }

                          const dateStr = toIso(year, month, day);
                          const isLocked = lockedDates.has(dateStr);
                          const isToday = year === todayY && month === todayM && day === todayD;
                          const isSelected = selectedDate?.y === year && selectedDate?.m === month && selectedDate?.d === day;

                          let bgColor = 'white';
                          let textColor = '#111827';
                          let borderColor = '#E5E7EB';

                          if (isLocked) {
                            bgColor = '#DC2626';
                            textColor = 'white';
                          } else if (isToday) {
                            bgColor = '#FFD700';
                            textColor = '#92400E';
                          }

                          if (isSelected) {
                            borderColor = '#C8102E';
                          }

                          return (
                            <div
                              key={dateStr}
                              onClick={() => handleDayClick(day)}
                              className="border-b border-r cursor-pointer relative group transition-all"
                              style={{
                                height: '50px',
                                backgroundColor: bgColor,
                                borderColor: borderColor,
                                borderWidth: isSelected ? '3px' : '1px',
                              }}
                            >
                              <div className="p-2 h-full flex flex-col">
                                <div className="flex items-start justify-between">
                                  <span
                                    className="text-sm font-semibold"
                                    style={{ color: textColor }}
                                  >
                                    {day}
                                  </span>
                                  {isLocked && (
                                    <div className="flex items-center gap-0.5">
                                      <Lock className="w-3 h-3" style={{ color: 'white' }} />
                                      <ChevronDown className="w-3 h-3" style={{ color: 'white' }} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!isLocked && !isToday && (
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ backgroundColor: 'rgba(200, 16, 46, 0.05)' }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  {selectedDate ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>SELECTED DAY</p>
                        <h3 className="text-base font-bold mb-1" style={{ color: '#111827' }}>
                          {getDayOfWeek(selectedDate.y, selectedDate.m, selectedDate.d)}, {MONTH_NAMES[selectedDate.m - 1]} {selectedDate.d}, {selectedDate.y}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {isSelectedLocked ? (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                            >
                              Locked
                            </span>
                          ) : (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                            >
                              Open
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                        <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
                          Click a date to lock or unlock daily operations.
                        </p>
                        <Button
                          onClick={handleToggleLock}
                          disabled={toggling !== null}
                          variant="primary"
                          className="w-full"
                        >
                          {toggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSelectedLocked ? (
                            <>
                              <Unlock className="w-4 h-4 mr-2" />
                              Unlock Date
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Lock Date
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                        <p className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>LEGEND</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: '#DC2626' }}
                            />
                            <span className="text-xs" style={{ color: '#374151' }}>Locked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}
                            />
                            <span className="text-xs" style={{ color: '#374151' }}>Open</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: '#FFD700' }}
                            />
                            <span className="text-xs" style={{ color: '#374151' }}>Today</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border-2"
                              style={{ backgroundColor: 'white', borderColor: '#C8102E' }}
                            />
                            <span className="text-xs" style={{ color: '#374151' }}>Selected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                      <p className="text-sm" style={{ color: '#6B7280' }}>
                        Select a date to view details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
