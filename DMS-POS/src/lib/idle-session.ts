/** POS idle logout — same idea as DMS web, 2 hours of no cashier activity. */
export const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000
export const IDLE_WARNING_MS = 2 * 60 * 1000

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
  'mousedown',
  'click',
  'scroll',
]

export function subscribeActivity(onActivity: () => void): () => void {
  const opts = { capture: true, passive: true } as const
  ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, opts))
  return () => {
    ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity, opts))
  }
}
