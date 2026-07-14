import Dexie, { type Table } from 'dexie'
import type { CategoryRow, ProductRow } from './types'
import type { PendingMutation } from './types'
import { isSqliteOfflineAvailable, SqliteOfflineDatabase } from './offline-sqlite-store'
import type { DroppedMutationRecord, LocalSale, LocalStockBf, LocalTransfer } from './local-db-types'

export type { LocalSale, LocalStockBf, LocalTransfer, DroppedMutationRecord } from './local-db-types'

type DmsPosWindow = Window & {
  dmsPos?: { sqliteOp: (op: string, payload?: unknown) => Promise<unknown> }
}

async function sqliteInvoke<T>(op: string, payload?: unknown): Promise<T> {
  const fn = (typeof window !== 'undefined' ? (window as DmsPosWindow).dmsPos?.sqliteOp : undefined)
  if (!fn) throw new Error('SQLite bridge unavailable')
  return fn(op, payload) as Promise<T>
}

const MIGRATION_FLAG = 'dms-pos-idb-to-sqlite-v1'

export class DmsPosDexie extends Dexie {
  products!: Table<ProductRow, string>
  categories!: Table<CategoryRow, string>
  pending!: Table<PendingMutation, string>
  sales!: Table<LocalSale, string>
  stockBf!: Table<LocalStockBf, string>
  transfers!: Table<LocalTransfer, string>
  droppedMutations!: Table<DroppedMutationRecord, string>

  constructor() {
    super('dms-pos')
    this.version(1).stores({
      products: 'id, categoryId, code, name',
      categories: 'id, name',
      pending: 'id, type, createdAt',
    })
    this.version(2).stores({
      products: 'id, categoryId, code, name',
      categories: 'id, name',
      pending: 'id, type, createdAt',
      sales: 'id, outletId, createdAt, synced',
      stockBf: 'id, outletId, processDate, createdAt, synced',
      transfers: 'id, fromOutletId, toOutletId, createdAt, synced',
    })
    this.version(3).stores({
      products: 'id, categoryId, code, name',
      categories: 'id, name',
      pending: 'id, type, createdAt',
      sales: 'id, outletId, createdAt, synced',
      stockBf: 'id, outletId, processDate, createdAt, synced',
      transfers: 'id, fromOutletId, toOutletId, createdAt, synced',
      droppedMutations: 'id, type, droppedAt',
    })
  }
}

/** IndexedDB-backed store (browser / dev without Electron SQLite). */
export class DexieOfflineDatabase {
  private readonly d: DmsPosDexie
  constructor(d: DmsPosDexie) {
    this.d = d
  }

  get products() {
    return this.d.products
  }
  get categories() {
    return this.d.categories
  }
  get pending() {
    return this.d.pending
  }
  get sales() {
    return this.d.sales
  }
  get stockBf() {
    return this.d.stockBf
  }
  get transfers() {
    return this.d.transfers
  }
  get droppedMutations() {
    return this.d.droppedMutations
  }

  async listLocalSalesForOutlet(outletId: string, limit: number): Promise<LocalSale[]> {
    const rows = await this.d.sales.where('outletId').equals(outletId).sortBy('createdAt')
    return rows.reverse().slice(0, limit)
  }

  async replaceAllProducts(rows: ProductRow[]): Promise<void> {
    await this.d.products.clear()
    await this.d.products.bulkPut(rows)
  }

  async replaceAllCategories(rows: CategoryRow[]): Promise<void> {
    await this.d.categories.clear()
    await this.d.categories.bulkPut(rows)
  }
}

export type PosOfflineDatabase = DexieOfflineDatabase | SqliteOfflineDatabase

let _backend: PosOfflineDatabase | null = null

async function migrateDexieToSqliteOnce(): Promise<void> {
  if (!isSqliteOfflineAvailable()) return
  if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_FLAG)) return

  const existing = await sqliteInvoke<ProductRow[]>('productsGetAll')
  if (existing.length > 0) {
    localStorage.setItem(MIGRATION_FLAG, '1')
    return
  }

  const dexie = new DmsPosDexie()
  const [products, categories, pending, sales, stockBf, droppedMutations] = await Promise.all([
    dexie.products.toArray(),
    dexie.categories.toArray(),
    dexie.pending.toArray(),
    dexie.sales.toArray(),
    dexie.stockBf.toArray(),
    dexie.droppedMutations.toArray(),
  ])
  const any =
    products.length ||
    categories.length ||
    pending.length ||
    sales.length ||
    stockBf.length ||
    droppedMutations.length
  if (!any) {
    localStorage.setItem(MIGRATION_FLAG, '1')
    return
  }

  await sqliteInvoke('seedFromMigration', {
    products,
    categories,
    pending,
    sales,
    stockBf,
    droppedMutations,
  })
  localStorage.setItem(MIGRATION_FLAG, '1')
  await dexie.delete().catch(() => {})
}

/**
 * Must be awaited before React renders so the first offline read uses the right backend
 * and a one-time IndexedDB snapshot is copied into SQLite when upgrading terminals.
 */
export async function initOfflineStorage(): Promise<void> {
  if (_backend) return
  if (isSqliteOfflineAvailable()) {
    try {
      await migrateDexieToSqliteOnce()
      _backend = new SqliteOfflineDatabase()
    } catch (e) {
      console.error('[DMS-POS] SQLite init failed; falling back to IndexedDB (Dexie)', e)
      _backend = new DexieOfflineDatabase(new DmsPosDexie())
    }
  } else {
    _backend = new DexieOfflineDatabase(new DmsPosDexie())
  }
}

function getBackend(): PosOfflineDatabase {
  if (!_backend) {
    throw new Error('initOfflineStorage() must be awaited before using offlineDb')
  }
  return _backend
}

/** Atomically replace catalogue in the active backend (SQLite: single IPC per table; Dexie: clear + bulkPut). */
export async function replaceOfflineCatalog(products: ProductRow[], categories: CategoryRow[]): Promise<void> {
  const b = getBackend()
  if (b instanceof SqliteOfflineDatabase) {
    await Promise.all([b.replaceAllProducts(products), b.replaceAllCategories(categories)])
  } else {
    const d = b as DexieOfflineDatabase
    await d.replaceAllProducts(products)
    await d.replaceAllCategories(categories)
  }
}

/** Synced local rows still marked Pending — poll server via GET /api/pos-sales/{serverSaleId}. */
export async function listLocalSalesPendingStatusRefresh(
  limit: number,
  outletId?: string | null,
): Promise<LocalSale[]> {
  const b = getBackend()
  const cap = Math.min(200, Math.max(1, limit)) // Increased max to 200
  if (b instanceof SqliteOfflineDatabase) {
    return sqliteInvoke<LocalSale[]>('salesListPendingStatusRefresh', {
      limit: cap,
      outletId: outletId ?? null,
    })
  }
  const all = await (b as DexieOfflineDatabase).sales.toArray()
  const pending = (s: LocalSale) =>
    Boolean(
      s.serverSaleId &&
        s.synced &&
        (!s.status || String(s.status).trim().toLowerCase() === 'pending'),
    )
  let rows = outletId ? all.filter((s) => pending(s) && s.outletId === outletId) : all.filter(pending)
  rows = rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, cap)
  return rows
}

/** Unified offline store: SQLite (Electron) or Dexie (IndexedDB). */
export const offlineDb = new Proxy({} as PosOfflineDatabase, {
  get(_target, prop: string | symbol) {
    if (prop === 'then') return undefined
    const p = String(prop)
    const b = getBackend() as unknown as Record<string, unknown>
    return b[p]
  },
}) as unknown as PosOfflineDatabase
