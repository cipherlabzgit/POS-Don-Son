import { useEffect, useState } from 'react'
import { X, RefreshCw, Trash2 } from 'lucide-react'
import { offlineDb } from '../lib/offline-db'
import { syncCatalogFromServer } from '../lib/catalog-sync'
import { toast } from '../lib/toast-store'
import type { ProductRow, CategoryRow } from '../lib/types'

export function DiagnosticPage({ onClose }: { onClose: () => void }) {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function loadData() {
    try {
      const [p, c] = await Promise.all([
        offlineDb.products.toArray(),
        offlineDb.categories.toArray(),
      ])
      setProducts(p)
      setCategories(c)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function handleClearAndSync() {
    if (!confirm('Clear all cached products and re-sync from server?')) return
    setSyncing(true)
    setSyncError(null)
    try {
      await offlineDb.products.clear()
      await offlineDb.categories.clear()
      toast('Cache cleared. Syncing from server...', 'info')
      await syncCatalogFromServer()
      toast('Catalog synced successfully!', 'success')
      await loadData()
    } catch (e) {
      const msg = (e as Error).message
      setSyncError(msg)
      toast(msg, 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function handleResync() {
    setSyncing(true)
    setSyncError(null)
    try {
      await syncCatalogFromServer()
      toast('Catalog synced successfully!', 'success')
      await loadData()
    } catch (e) {
      const msg = (e as Error).message
      setSyncError(msg)
      toast(msg, 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--brand-primary)] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">POS Diagnostic</h2>
            <p className="text-sm text-white/70">Check product cache and database status</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">Loading database information...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] p-4">
                  <p className="text-sm font-semibold text-[var(--muted-foreground)]">Products in Cache</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{products.length}</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] p-4">
                  <p className="text-sm font-semibold text-[var(--muted-foreground)]">Categories in Cache</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{categories.length}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResync}
                  disabled={syncing}
                  className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Re-sync from Server
                </button>
                <button
                  type="button"
                  onClick={handleClearAndSync}
                  disabled={syncing}
                  className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear & Re-sync
                </button>
              </div>

              {syncError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Sync failed</p>
                  <p className="mt-1">{syncError}</p>
                </div>
              ) : null}

              {/* Sample Products */}
              {products.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Sample Products (first 5)
                  </h3>
                  <div className="space-y-2">
                    {products.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-[var(--border)] bg-white p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[var(--foreground)]">{p.name || '(no name)'}</p>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              Code: {p.code || '(no code)'} • Category: {p.categoryName || '(no category)'}
                            </p>
                          </div>
                          <p className="flex-shrink-0 font-bold text-[var(--foreground)]">
                            Rs {p.unitPrice?.toFixed(2) ?? '0.00'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">No products found in cache!</p>
                  <p className="mt-1">
                    The offline database is empty. Click "Re-sync from Server" to download the product catalog.
                  </p>
                </div>
              )}

              {/* Sample Categories */}
              {categories.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--neutral-50)] px-3 py-1.5 text-sm font-medium"
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Data Quality Checks */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Data Quality Checks
                </h3>
                <div className="space-y-2 text-sm">
                  <DataCheck
                    label="Products with missing names"
                    count={products.filter((p) => !p.name || p.name.trim() === '').length}
                    isIssue
                  />
                  <DataCheck
                    label="Products with zero price"
                    count={products.filter((p) => !p.unitPrice || p.unitPrice === 0).length}
                    isIssue
                  />
                  <DataCheck
                    label="Products with valid data"
                    count={products.filter((p) => p.name && p.name.trim() !== '' && p.unitPrice > 0).length}
                    isIssue={false}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--neutral-50)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[var(--neutral-800)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--neutral-900)]"
          >
            Close Diagnostic
          </button>
        </div>
      </div>
    </div>
  )
}

function DataCheck({ label, count, isIssue }: { label: string; count: number; isIssue: boolean }) {
  const color = isIssue
    ? count > 0
      ? 'text-red-600'
      : 'text-green-600'
    : count > 0
    ? 'text-green-600'
    : 'text-[var(--muted-foreground)]'
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2">
      <span className="text-[var(--foreground)]">{label}</span>
      <span className={`font-bold tabular-nums ${color}`}>{count}</span>
    </div>
  )
}
