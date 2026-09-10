import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowBigUp, Delete, X } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  label?: string
  placeholder?: string
  onEnter?: () => void
  /** Item-code search: caps stay on and digits stay on the letter layout so BI2 is three taps. */
  forItemCode?: boolean
}

const ALPHA = {
  r1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  r2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  r3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
}

const NUM = {
  r1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  r2: ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  r3: ['.', ',', '?', '!', "'", '#', '%'],
}

const KEY =
  'pos-tap flex h-8 min-w-0 flex-1 items-center justify-center rounded-md bg-[#3a3a3a] text-[13px] font-semibold text-white shadow-sm hover:bg-[#4a4a4a] active:scale-[0.97]'
const MOD =
  'pos-tap flex h-8 items-center justify-center rounded-md bg-[#2a2a2a] px-2.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#3a3a3a] active:scale-[0.97]'

/** Compact on-screen keyboard. Dropdowns should use z-[90] so they sit above it. */
export const POS_OSK_HEIGHT = '11rem'

export function SearchKeyboard({
  value,
  onChange,
  onClose,
  onEnter,
  forItemCode = false,
}: Props) {
  const [digits, setDigits] = useState(false)
  const [shift, setShift] = useState(forItemCode)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--pos-osk-height', POS_OSK_HEIGHT)
    root.classList.add('pos-osk-open')
    return () => {
      root.style.removeProperty('--pos-osk-height')
      root.classList.remove('pos-osk-open')
    }
  }, [])

  function press(ch: string) {
    const letters = !digits && /[a-z]/i.test(ch)
    const next = shift && letters ? ch.toUpperCase() : ch
    onChange(value + next)
    if (shift && !forItemCode) setShift(false)
  }

  function backspace() {
    onChange(value.slice(0, -1))
  }

  const rows = digits ? NUM : ALPHA

  useEffect(() => {
    function isNativeTextField(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false
      if (el.isContentEditable) return true
      if (el.tagName === 'TEXTAREA') return true
      if (el.tagName !== 'INPUT') return false
      const type = (el as HTMLInputElement).type
      return type !== 'button' && type !== 'submit' && type !== 'checkbox' && type !== 'radio'
    }

    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      if (isNativeTextField(e.target)) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        onEnter?.()
        onClose()
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        onChange(value.slice(0, -1))
        return
      }
      if (e.key === ' ') {
        e.preventDefault()
        onChange(value + ' ')
        return
      }
      if (e.key.length === 1) {
        e.preventDefault()
        onChange(value + e.key)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onChange, onClose, onEnter])

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center">
      <div data-pos-osk className="pointer-events-auto w-full max-w-3xl rounded-t-xl border-t-2 border-[var(--brand-primary)] bg-[#141414] px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-6px_24px_rgba(0,0,0,0.4)]">
        <div className="mb-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pos-tap rounded-md bg-[var(--brand-primary)] p-1 text-white hover:bg-[var(--brand-primary-dark)]"
            aria-label="Close keyboard"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {!digits && forItemCode ? (
            <div className="flex gap-1">
              {NUM.r1.map((k) => (
                <button key={k} type="button" className={KEY} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex gap-1">
            {rows.r1.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>
                {shift && !digits ? k.toUpperCase() : k}
              </button>
            ))}
          </div>
          <div className={`flex gap-1 ${digits ? '' : 'px-4'}`}>
            {rows.r2.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>
                {shift && !digits ? k.toUpperCase() : k}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {!digits ? (
              <button
                type="button"
                className={`${MOD} w-11 ${shift ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]' : ''}`}
                onClick={() => setShift((s) => !s)}
                aria-label={forItemCode ? 'Caps lock' : 'Shift'}
              >
                <ArrowBigUp className="h-4 w-4" />
              </button>
            ) : null}
            {rows.r3.map((k) => (
              <button key={k} type="button" className={KEY} onClick={() => press(k)}>
                {shift && !digits ? k.toUpperCase() : k}
              </button>
            ))}
            <button type="button" className={`${MOD} w-11`} onClick={backspace} aria-label="Backspace">
              <Delete className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className={`${MOD} min-w-[3.25rem]`}
              onClick={() => {
                setDigits((d) => !d)
                if (!forItemCode) setShift(false)
              }}
            >
              {digits ? 'ABC' : '123'}
            </button>
            <button
              type="button"
              className="pos-tap h-8 flex-1 rounded-md bg-[#3a3a3a] text-[12px] font-semibold text-white hover:bg-[#4a4a4a]"
              onClick={() => press(' ')}
            >
              Space
            </button>
            <button
              type="button"
              className="pos-tap h-8 min-w-[4.5rem] rounded-md bg-[var(--brand-primary)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brand-primary-dark)]"
              onClick={() => {
                onEnter?.()
                onClose()
              }}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
