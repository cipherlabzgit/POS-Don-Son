import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

type PosSubPageLayoutProps = {
  title: string
  subtitle?: string
  onBack: () => void
  children: ReactNode
  bottomBar?: ReactNode
  badge?: ReactNode
}

export function PosSubPageLayout({
  title,
  subtitle,
  onBack,
  children,
  bottomBar,
  badge,
}: PosSubPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--neutral-100)] text-[var(--foreground)]">
      {/* Brand header — matches PosMainPage */}
      <header className="sticky top-0 z-20 border-b border-[var(--brand-primary-dark)] bg-[var(--brand-primary)] shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="pos-tap flex shrink-0 items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>Back to POS</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-pos-title text-xl font-bold text-white sm:text-2xl">{title}</h1>
              {badge}
            </div>
            {subtitle ? (
              <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-white/75">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>

      {bottomBar ? (
        <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-white/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">{bottomBar}</div>
        </div>
      ) : null}
    </div>
  )
}
