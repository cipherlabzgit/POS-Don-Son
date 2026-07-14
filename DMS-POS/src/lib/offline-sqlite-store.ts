import type { CategoryRow, ProductRow } from './types'
import type { PendingMutation } from './types'
import type { DroppedMutationRecord, LocalSale, LocalStockBf } from './local-db-types'

type DmsPosWindow = Window & {
  dmsPos?: {
    sqliteOp: (op: string, payload?: unknown) => Promise<unknown>
  }
}

async function sqliteOp<T>(op: string, payload?: unknown): Promise<T> {
  const fn = (typeof window !== 'undefined' ? (window as DmsPosWindow).dmsPos?.sqliteOp : undefined)
  if (!fn) throw new Error('SQLite offline bridge is not available')
  return fn(op, payload) as Promise<T>
}

export function isSqliteOfflineAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as DmsPosWindow).dmsPos?.sqliteOp === 'function'
}

class SqlitePendingOrder {
  private readonly parent: SqliteOfflineDatabase
  constructor(parent: SqliteOfflineDatabase) {
    this.parent = parent
  }
  toArray(): Promise<PendingMutation[]> {
    return this.parent.pendingGetAllOrdered()
  }
}

class SqlitePendingTable {
  private readonly parent: SqliteOfflineDatabase
  constructor(parent: SqliteOfflineDatabase) {
    this.parent = parent
  }

  toArray(): Promise<PendingMutation[]> {
    return this.parent.pendingGetAllOrdered()
  }

  put(m: Omit<PendingMutation, 'retryCount'> & { retryCount?: number }): Promise<void> {
    const row: PendingMutation = {
      id: m.id,
      type: m.type,
      payload: m.payload,
      createdAt: m.createdAt,
      retryCount: m.retryCount ?? 0,
    }
    return sqliteOp('pendingPut', row).then(() => undefined)
  }

  orderBy(_field: 'createdAt'): SqlitePendingOrder {
    return new SqlitePendingOrder(this.parent)
  }

  delete(id: string): Promise<void> {
    return sqliteOp('pendingDelete', id).then(() => undefined)
  }

  update(id: string, patch: Partial<PendingMutation>): Promise<void> {
    return sqliteOp('pendingUpdate', { id, patch }).then(() => undefined)
  }
}

export class SqliteOfflineDatabase {
  readonly pending: SqlitePendingTable

  constructor() {
    this.pending = new SqlitePendingTable(this)
  }

  pendingGetAllOrdered(): Promise<PendingMutation[]> {
    return sqliteOp<PendingMutation[]>('pendingGetAllOrdered')
  }

  products = {
    toArray: (): Promise<ProductRow[]> => sqliteOp<ProductRow[]>('productsGetAll'),
    clear: async (): Promise<void> => {
      await sqliteOp('productsSetAll', { rows: [] })
    },
    bulkPut: async (rows: ProductRow[]): Promise<void> => {
      const cur = await sqliteOp<ProductRow[]>('productsGetAll')
      const map = new Map(cur.map((r) => [r.id, r]))
      for (const r of rows) map.set(r.id, r)
      await sqliteOp('productsSetAll', { rows: [...map.values()] })
    },
  }

  categories = {
    toArray: (): Promise<CategoryRow[]> => sqliteOp<CategoryRow[]>('categoriesGetAll'),
    clear: async (): Promise<void> => {
      await sqliteOp('categoriesSetAll', { rows: [] })
    },
    bulkPut: async (rows: CategoryRow[]): Promise<void> => {
      const cur = await sqliteOp<CategoryRow[]>('categoriesGetAll')
      const map = new Map(cur.map((r) => [r.id, r]))
      for (const r of rows) map.set(r.id, r)
      await sqliteOp('categoriesSetAll', { rows: [...map.values()] })
    },
  }

  sales = {
    put: (s: LocalSale): Promise<void> => sqliteOp('salesPut', s).then(() => undefined),
    update: (id: string, patch: Partial<LocalSale>): Promise<void> =>
      sqliteOp('salesUpdate', { id, patch }).then(() => undefined),
  }

  stockBf = {
    put: (s: LocalStockBf): Promise<void> => sqliteOp('stockBfPut', s).then(() => undefined),
    update: (id: string, patch: Partial<LocalStockBf>): Promise<void> =>
      sqliteOp('stockBfUpdate', { id, patch }).then(() => undefined),
  }

  droppedMutations = {
    put: (m: DroppedMutationRecord): Promise<void> => sqliteOp('droppedMutationsPut', m).then(() => undefined),
    toArray: (): Promise<DroppedMutationRecord[]> => sqliteOp<DroppedMutationRecord[]>('droppedMutationsGetAll'),
  }

  async listLocalSalesForOutlet(outletId: string, limit: number): Promise<LocalSale[]> {
    return sqliteOp<LocalSale[]>('salesListByOutletDesc', { outletId, limit })
  }

  /** Full replace (atomic on main process) — use for catalogue sync instead of clear + bulkPut. */
  replaceAllProducts(rows: ProductRow[]): Promise<void> {
    return sqliteOp('productsSetAll', { rows }).then(() => undefined)
  }

  replaceAllCategories(rows: CategoryRow[]): Promise<void> {
    return sqliteOp('categoriesSetAll', { rows }).then(() => undefined)
  }
}
