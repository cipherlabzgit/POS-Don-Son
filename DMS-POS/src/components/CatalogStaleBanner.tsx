import { useState } from 'react'
import { useSettingsStore } from '../lib/settings-store'
import { syncCatalogFromServer } from '../lib/catalog-sync'
import { isCatalogStale } from '../lib/catalog-stale'
import { toast } from '../lib/toast-store'

type Props = {
  online: boolean
}

export function CatalogStaleBanner({ online }: Props) {
  const cacheUpdatedAt = useSettingsStore((s) => s.cacheUpdatedAt)
  const [busy, setBusy] = useState(false)

  if (!isCatalogStale(cacheUpdatedAt)) return null

  async function refresh() {
    if (!online) {
      toast('Connect online to refresh the catalogue.', 'info')
      return
    }
    setBusy(true)
    try {
      await syncCatalogFromServer()
      toast('Catalogue updated.', 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>
        <strong>Product cache may be outdated</strong>
        {' '}
        (last sync {cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleString() : 'never'}). Refresh online before submitting if unsure.
      </p>
      <button
        type="button"
        disabled={busy || !online}
        onClick={() => void refresh()}
        className="pos-tap shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow ring-1 ring-amber-300 hover:bg-amber-100 disabled:opacity-40"
      >
        {busy ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}
