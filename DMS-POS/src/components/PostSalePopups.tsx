import { useEffect, useRef, useState } from 'react'
import { isElectronPos, printReceiptHtml, type PrintReceiptOpts } from '../lib/print-receipt'
import { toast } from '../lib/toast-store'

export type PostSaleState = {
  change: number
  cash: number
  total: number
  receiptOpts: PrintReceiptOpts
}

type Props = {
  state: PostSaleState
  onDone: () => void
  onBrowserPreview?: (opts: PrintReceiptOpts) => void
}

export function PostSalePopups({ state, onDone, onBrowserPreview }: Props) {
  const [printDone, setPrintDone] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(5)
  const appliedRef = useRef(false)
  const finishedRef = useRef(false)

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    onDone()
  }

  async function applyPrintChoice(wantPrint: boolean) {
    if (appliedRef.current) return
    appliedRef.current = true
    setPrintDone(true)
    if (wantPrint) {
      if (isElectronPos()) {
        const ok = await printReceiptHtml(state.receiptOpts, { silentOnly: true })
        if (!ok) toast('Unable to print — try again.', 'error')
      } else {
        onBrowserPreview?.(state.receiptOpts)
      }
    }
    try {
      await window.dmsPos?.openCashDrawer?.()
    } catch {
      /* drawer kick is best-effort */
    }
  }

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    const timeout = setTimeout(async () => {
      if (!appliedRef.current) await applyPrintChoice(true)
      finish()
    }, 5000)
    return () => {
      clearInterval(tick)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after Pay
  }, [])

  async function handleBalanceOk() {
    if (!appliedRef.current) await applyPrintChoice(true)
    finish()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
      <div className="flex w-full max-w-3xl flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Balance</p>
          <p className="font-pos-title mt-1 text-4xl font-extrabold tabular-nums text-[var(--brand-primary)]">
            Rs {state.change.toFixed(2)}
          </p>
          <div className="mt-4 space-y-1 text-sm tabular-nums text-[var(--muted-foreground)]">
            <p>Total: Rs {state.total.toFixed(2)}</p>
            <p>Cash: Rs {state.cash.toFixed(2)}</p>
          </div>
          <button
            type="button"
            className="pos-tap mt-6 w-full rounded-xl bg-[var(--brand-primary)] py-4 text-lg font-bold text-white"
            onClick={() => void handleBalanceOk()}
          >
            OK
          </button>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            New bill in {secondsLeft}s
          </p>
        </div>

        {!printDone ? (
          <div className="flex-1 rounded-2xl border-2 border-[var(--brand-accent)] bg-white p-6 text-center shadow-2xl">
            <p className="font-pos-title text-2xl font-bold text-[var(--foreground)]">
              Do You Want To Print Bill?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                className="pos-tap rounded-xl bg-[var(--brand-accent)] py-4 text-lg font-bold text-neutral-900 ring-4 ring-[var(--brand-accent)]/50"
                onClick={() => void applyPrintChoice(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className="pos-tap rounded-xl border-2 border-[var(--border)] py-4 text-lg font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                onClick={() => void applyPrintChoice(false)}
              >
                No
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">Yes is selected by default</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
