/**
 * SQLite local store for DMS-POS (Electron main process).
 * Accessed from renderer via IPC only — no raw SQL from untrusted input.
 */
import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'

/** @type {import('better-sqlite3').Database | null} */
let db = null

const SCHEMA_VERSION = 3

function getDbPath() {
  const dir = app.getPath('userData')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'pos-offline.sqlite')
}

function openDb() {
  if (db) return db
  const file = getDbPath()
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

/**
 * @param {import('better-sqlite3').Database} database
 */
function migrate(database) {
  let v = database.prepare('PRAGMA user_version').get().user_version
  if (v >= SCHEMA_VERSION) return

  if (v < 1) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      category_name TEXT NOT NULL,
      sort_order REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      sort_order REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS pending (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_pending_created ON pending(created_at);
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      outlet_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      total REAL NOT NULL,
      lines_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      sale_no TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sales_outlet_created ON sales(outlet_id, created_at);
    CREATE TABLE IF NOT EXISTS stock_bf (
      id TEXT PRIMARY KEY NOT NULL,
      outlet_id TEXT NOT NULL,
      process_date TEXT NOT NULL,
      lines_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY NOT NULL,
      from_outlet_id TEXT NOT NULL,
      to_outlet_id TEXT NOT NULL,
      transfer_date TEXT NOT NULL,
      notes_json TEXT,
      lines_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS dropped_mutations (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      dropped_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0
    );
    PRAGMA user_version = 1;
  `)
    v = 1
  }

  if (v < 2) {
    const cols = database.prepare('PRAGMA table_info(sales)').all().map((c) => c.name)
    if (!cols.includes('server_sale_id')) {
      database.exec('ALTER TABLE sales ADD COLUMN server_sale_id TEXT')
    }
    if (!cols.includes('status')) {
      database.exec('ALTER TABLE sales ADD COLUMN status TEXT')
    }
    if (!cols.includes('rejection_reason')) {
      database.exec('ALTER TABLE sales ADD COLUMN rejection_reason TEXT')
    }
    database.pragma('user_version = 2')
  }

  if (v < 3) {
    const prodCols = database.prepare('PRAGMA table_info(products)').all().map((c) => c.name)
    if (!prodCols.includes('require_open_stock')) {
      database.exec('ALTER TABLE products ADD COLUMN require_open_stock INTEGER NOT NULL DEFAULT 1')
    }
    database.pragma('user_version = 3')
  }
}

const ALLOWED = new Set([
  'noop',
  'productsGetAll',
  'productsSetAll',
  'categoriesGetAll',
  'categoriesSetAll',
  'pendingGetAllOrdered',
  'pendingPut',
  'pendingDelete',
  'pendingUpdate',
  'salesPut',
  'salesUpdate',
  'salesListByOutletDesc',
  'salesListPendingStatusRefresh',
  'stockBfPut',
  'stockBfUpdate',
  'droppedMutationsPut',
  'seedFromMigration',
])

/**
 * @param {import('better-sqlite3').Database} d
 * @param {string} op
 * @param {unknown} payload
 */
function dispatch(d, op, payload) {
  switch (op) {
    case 'noop':
      return null

    case 'productsGetAll': {
      const rows = d.prepare('SELECT * FROM products ORDER BY sort_order, name').all()
      return rows.map(mapProductRow)
    }

    case 'productsSetAll': {
      const rows = /** @type {Record<string, unknown>[]} */ (payload?.rows ?? [])
      const trx = d.transaction(() => {
        d.prepare('DELETE FROM products').run()
        const ins = d.prepare(`
          INSERT INTO products (id, category_id, code, name, unit_price, category_name, sort_order, require_open_stock)
          VALUES (@id, @category_id, @code, @name, @unit_price, @category_name, @sort_order, @require_open_stock)
        `)
        for (const r of rows) {
          const ros = r.requireOpenStock ?? r.require_open_stock
          ins.run({
            id: String(r.id),
            category_id: String(r.categoryId ?? r.category_id ?? ''),
            code: String(r.code ?? ''),
            name: String(r.name ?? ''),
            unit_price: Number(r.unitPrice ?? r.unit_price ?? 0),
            category_name: String(r.categoryName ?? r.category_name ?? ''),
            sort_order: Number(r.sortOrder ?? r.sort_order ?? 0),
            require_open_stock: ros === undefined || ros === null ? 1 : ros === true || ros === 1 ? 1 : 0,
          })
        }
      })
      trx()
      return null
    }

    case 'categoriesGetAll': {
      const rows = d.prepare('SELECT * FROM categories ORDER BY sort_order, name').all()
      return rows.map(mapCategoryRow)
    }

    case 'categoriesSetAll': {
      const rows = /** @type {Record<string, unknown>[]} */ (payload?.rows ?? [])
      const trx = d.transaction(() => {
        d.prepare('DELETE FROM categories').run()
        const ins = d.prepare(`
          INSERT INTO categories (id, name, code, sort_order)
          VALUES (@id, @name, @code, @sort_order)
        `)
        for (const r of rows) {
          ins.run({
            id: String(r.id),
            name: String(r.name ?? ''),
            code: r.code != null ? String(r.code) : null,
            sort_order: Number(r.sortOrder ?? r.sort_order ?? 0),
          })
        }
      })
      trx()
      return null
    }

    case 'pendingGetAllOrdered': {
      const rows = d.prepare('SELECT * FROM pending ORDER BY created_at ASC').all()
      return rows.map(mapPendingRow)
    }

    case 'pendingPut': {
      const m = /** @type {Record<string, unknown>} */ (payload ?? {})
      d.prepare(`
        INSERT OR REPLACE INTO pending (id, type, payload_json, created_at, retry_count)
        VALUES (@id, @type, @payload_json, @created_at, @retry_count)
      `).run({
        id: String(m.id),
        type: String(m.type),
        payload_json: JSON.stringify(m.payload ?? {}),
        created_at: Number(m.createdAt ?? m.created_at ?? 0),
        retry_count: Number(m.retryCount ?? m.retry_count ?? 0),
      })
      return null
    }

    case 'pendingDelete': {
      d.prepare('DELETE FROM pending WHERE id = ?').run(String(payload))
      return null
    }

    case 'pendingUpdate': {
      const p = /** @type {{ id: string; patch: Record<string, unknown> }} */ (payload)
      const cur = d.prepare('SELECT * FROM pending WHERE id = ?').get(p.id)
      if (!cur) return null
      const merged = { ...mapPendingRow(cur), ...p.patch }
      d.prepare(`
        INSERT OR REPLACE INTO pending (id, type, payload_json, created_at, retry_count)
        VALUES (@id, @type, @payload_json, @created_at, @retry_count)
      `).run({
        id: merged.id,
        type: merged.type,
        payload_json: JSON.stringify(merged.payload ?? {}),
        created_at: merged.createdAt,
        retry_count: merged.retryCount,
      })
      return null
    }

    case 'salesPut': {
      const s = /** @type {Record<string, unknown>} */ (payload ?? {})
      d.prepare(`
        INSERT OR REPLACE INTO sales (id, outlet_id, payment_method, total, lines_json, created_at, synced, sale_no, server_sale_id, status, rejection_reason)
        VALUES (@id, @outlet_id, @payment_method, @total, @lines_json, @created_at, @synced, @sale_no, @server_sale_id, @status, @rejection_reason)
      `).run({
        id: String(s.id),
        outlet_id: String(s.outletId ?? s.outlet_id ?? ''),
        payment_method: String(s.paymentMethod ?? s.payment_method ?? ''),
        total: Number(s.total ?? 0),
        lines_json: JSON.stringify(s.lines ?? []),
        created_at: Number(s.createdAt ?? s.created_at ?? Date.now()),
        synced: s.synced === true || s.synced === 1 ? 1 : 0,
        sale_no: s.saleNo != null ? String(s.saleNo) : s.sale_no != null ? String(s.sale_no) : null,
        server_sale_id: s.serverSaleId != null ? String(s.serverSaleId) : s.server_sale_id != null ? String(s.server_sale_id) : null,
        status: s.status != null ? String(s.status) : null,
        rejection_reason:
          s.rejectionReason != null ? String(s.rejectionReason) : s.rejection_reason != null ? String(s.rejection_reason) : null,
      })
      return null
    }

    case 'salesUpdate': {
      const p = /** @type {{ id: string; patch: Record<string, unknown> }} */ (payload)
      const cur = d.prepare('SELECT * FROM sales WHERE id = ?').get(p.id)
      if (!cur) return null
      const row = mapSaleRow(cur)
      const n = { ...row, ...p.patch }
      d.prepare(`
        INSERT OR REPLACE INTO sales (id, outlet_id, payment_method, total, lines_json, created_at, synced, sale_no, server_sale_id, status, rejection_reason)
        VALUES (@id, @outlet_id, @payment_method, @total, @lines_json, @created_at, @synced, @sale_no, @server_sale_id, @status, @rejection_reason)
      `).run({
        id: n.id,
        outlet_id: n.outletId,
        payment_method: n.paymentMethod,
        total: n.total,
        lines_json: JSON.stringify(n.lines),
        created_at: n.createdAt,
        synced: n.synced ? 1 : 0,
        sale_no: n.saleNo ?? null,
        server_sale_id: n.serverSaleId ?? null,
        status: n.status ?? null,
        rejection_reason: n.rejectionReason ?? null,
      })
      return null
    }

    case 'salesListByOutletDesc': {
      const outletId = String(payload?.outletId ?? '')
      const limit = Math.min(500, Math.max(1, Number(payload?.limit ?? 50)))
      const rows = d
        .prepare('SELECT * FROM sales WHERE outlet_id = ? ORDER BY created_at DESC LIMIT ?')
        .all(outletId, limit)
      return rows.map(mapSaleRow)
    }

    case 'salesListPendingStatusRefresh': {
      const limit = Math.min(100, Math.max(1, Number(payload?.limit ?? 25)))
      const outletId = payload?.outletId != null ? String(payload.outletId) : null
      /** Pending workflow on server; local row may still say Pending after web approve/reject. */
      const rows = outletId
        ? d
            .prepare(
              `SELECT * FROM sales
               WHERE server_sale_id IS NOT NULL AND synced = 1
               AND (status IS NULL OR LOWER(TRIM(status)) = 'pending')
               AND outlet_id = ?
               ORDER BY created_at DESC LIMIT ?`,
            )
            .all(outletId, limit)
        : d
            .prepare(
              `SELECT * FROM sales
               WHERE server_sale_id IS NOT NULL AND synced = 1
               AND (status IS NULL OR LOWER(TRIM(status)) = 'pending')
               ORDER BY created_at DESC LIMIT ?`,
            )
            .all(limit)
      return rows.map(mapSaleRow)
    }

    case 'stockBfPut': {
      const s = /** @type {Record<string, unknown>} */ (payload ?? {})
      d.prepare(`
        INSERT OR REPLACE INTO stock_bf (id, outlet_id, process_date, lines_json, created_at, synced)
        VALUES (@id, @outlet_id, @process_date, @lines_json, @created_at, @synced)
      `).run({
        id: String(s.id),
        outlet_id: String(s.outletId ?? s.outlet_id ?? ''),
        process_date: String(s.processDate ?? s.process_date ?? ''),
        lines_json: JSON.stringify(s.lines ?? []),
        created_at: Number(s.createdAt ?? s.created_at ?? Date.now()),
        synced: s.synced ? 1 : 0,
      })
      return null
    }

    case 'stockBfUpdate': {
      const p = /** @type {{ id: string; patch: Record<string, unknown> }} */ (payload)
      const cur = d.prepare('SELECT * FROM stock_bf WHERE id = ?').get(p.id)
      if (!cur) return null
      const row = mapStockBfRow(cur)
      const n = { ...row, ...p.patch }
      d.prepare(`
        INSERT OR REPLACE INTO stock_bf (id, outlet_id, process_date, lines_json, created_at, synced)
        VALUES (@id, @outlet_id, @process_date, @lines_json, @created_at, @synced)
      `).run({
        id: n.id,
        outlet_id: n.outletId,
        process_date: n.processDate,
        lines_json: JSON.stringify(n.lines),
        created_at: n.createdAt,
        synced: n.synced ? 1 : 0,
      })
      return null
    }

    case 'droppedMutationsPut': {
      const m = /** @type {Record<string, unknown>} */ (payload ?? {})
      d.prepare(`
        INSERT OR REPLACE INTO dropped_mutations (id, type, payload_json, created_at, dropped_at, retry_count)
        VALUES (@id, @type, @payload_json, @created_at, @dropped_at, @retry_count)
      `).run({
        id: String(m.id),
        type: String(m.type),
        payload_json: JSON.stringify(m.payload ?? {}),
        created_at: Number(m.createdAt ?? m.created_at ?? 0),
        dropped_at: Number(m.droppedAt ?? m.dropped_at ?? Date.now()),
        retry_count: Number(m.retryCount ?? m.retry_count ?? 0),
      })
      return null
    }

    case 'seedFromMigration': {
      const b = /** @type {Record<string, unknown>} */ (payload ?? {})
      const trx = d.transaction(() => {
        d.prepare('DELETE FROM products').run()
        d.prepare('DELETE FROM categories').run()
        d.prepare('DELETE FROM pending').run()
        d.prepare('DELETE FROM sales').run()
        d.prepare('DELETE FROM stock_bf').run()
        d.prepare('DELETE FROM dropped_mutations').run()

        const insP = d.prepare(`
          INSERT INTO products (id, category_id, code, name, unit_price, category_name, sort_order, require_open_stock)
          VALUES (@id, @category_id, @code, @name, @unit_price, @category_name, @sort_order, @require_open_stock)
        `)
        for (const r of /** @type {Record<string, unknown>[]} */ (b.products ?? [])) {
          const ros = r.requireOpenStock
          insP.run({
            id: String(r.id),
            category_id: String(r.categoryId ?? ''),
            code: String(r.code ?? ''),
            name: String(r.name ?? ''),
            unit_price: Number(r.unitPrice ?? 0),
            category_name: String(r.categoryName ?? ''),
            sort_order: Number(r.sortOrder ?? 0),
            require_open_stock: ros === undefined || ros === null ? 1 : ros === true || ros === 1 ? 1 : 0,
          })
        }

        const insC = d.prepare(`
          INSERT INTO categories (id, name, code, sort_order)
          VALUES (@id, @name, @code, @sort_order)
        `)
        for (const r of /** @type {Record<string, unknown>[]} */ (b.categories ?? [])) {
          insC.run({
            id: String(r.id),
            name: String(r.name ?? ''),
            code: r.code != null ? String(r.code) : null,
            sort_order: Number(r.sortOrder ?? 0),
          })
        }

        const insPe = d.prepare(`
          INSERT INTO pending (id, type, payload_json, created_at, retry_count)
          VALUES (@id, @type, @payload_json, @created_at, @retry_count)
        `)
        for (const m of /** @type {Record<string, unknown>[]} */ (b.pending ?? [])) {
          insPe.run({
            id: String(m.id),
            type: String(m.type),
            payload_json: JSON.stringify(m.payload ?? {}),
            created_at: Number(m.createdAt ?? 0),
            retry_count: Number(m.retryCount ?? 0),
          })
        }

        const insS = d.prepare(`
          INSERT INTO sales (id, outlet_id, payment_method, total, lines_json, created_at, synced, sale_no, server_sale_id, status, rejection_reason)
          VALUES (@id, @outlet_id, @payment_method, @total, @lines_json, @created_at, @synced, @sale_no, @server_sale_id, @status, @rejection_reason)
        `)
        for (const s of /** @type {Record<string, unknown>[]} */ (b.sales ?? [])) {
          insS.run({
            id: String(s.id),
            outlet_id: String(s.outletId ?? ''),
            payment_method: String(s.paymentMethod ?? ''),
            total: Number(s.total ?? 0),
            lines_json: JSON.stringify(s.lines ?? []),
            created_at: Number(s.createdAt ?? 0),
            synced: s.synced === true || s.synced === 1 ? 1 : 0,
            sale_no: s.saleNo != null ? String(s.saleNo) : null,
            server_sale_id: s.serverSaleId != null ? String(s.serverSaleId) : null,
            status: s.status != null ? String(s.status) : null,
            rejection_reason: s.rejectionReason != null ? String(s.rejectionReason) : null,
          })
        }

        const insBf = d.prepare(`
          INSERT INTO stock_bf (id, outlet_id, process_date, lines_json, created_at, synced)
          VALUES (@id, @outlet_id, @process_date, @lines_json, @created_at, @synced)
        `)
        for (const x of /** @type {Record<string, unknown>[]} */ (b.stockBf ?? [])) {
          insBf.run({
            id: String(x.id),
            outlet_id: String(x.outletId ?? ''),
            process_date: String(x.processDate ?? ''),
            lines_json: JSON.stringify(x.lines ?? []),
            created_at: Number(x.createdAt ?? 0),
            synced: x.synced === true || x.synced === 1 ? 1 : 0,
          })
        }

        const insD = d.prepare(`
          INSERT INTO dropped_mutations (id, type, payload_json, created_at, dropped_at, retry_count)
          VALUES (@id, @type, @payload_json, @created_at, @dropped_at, @retry_count)
        `)
        for (const m of /** @type {Record<string, unknown>[]} */ (b.droppedMutations ?? [])) {
          insD.run({
            id: String(m.id),
            type: String(m.type),
            payload_json: JSON.stringify(m.payload ?? {}),
            created_at: Number(m.createdAt ?? 0),
            dropped_at: Number(m.droppedAt ?? Date.now()),
            retry_count: Number(m.retryCount ?? 0),
          })
        }
      })
      trx()
      return null
    }

    default:
      throw new Error(`Unknown offline op: ${op}`)
  }
}

/** @param {Record<string, unknown>} r */
function mapProductRow(r) {
  const ros = r.require_open_stock
  return {
    id: String(r.id),
    categoryId: String(r.category_id),
    code: String(r.code),
    name: String(r.name),
    unitPrice: Number(r.unit_price),
    categoryName: String(r.category_name),
    sortOrder: Number(r.sort_order ?? 0),
    requireOpenStock: ros === undefined || ros === null ? true : Number(ros) !== 0,
  }
}

/** @param {Record<string, unknown>} r */
function mapCategoryRow(r) {
  return {
    id: String(r.id),
    name: String(r.name),
    code: r.code != null ? String(r.code) : undefined,
    sortOrder: Number(r.sort_order ?? 0),
  }
}

/** @param {Record<string, unknown>} r */
function mapPendingRow(r) {
  let payload = {}
  try {
    payload = JSON.parse(String(r.payload_json ?? '{}'))
  } catch { /* ignore */ }
  return {
    id: String(r.id),
    type: String(r.type),
    payload,
    createdAt: Number(r.created_at),
    retryCount: Number(r.retry_count ?? 0),
  }
}

/** @param {Record<string, unknown>} r */
function mapSaleRow(r) {
  let lines = []
  try {
    lines = JSON.parse(String(r.lines_json ?? '[]'))
  } catch { /* ignore */ }
  return {
    id: String(r.id),
    outletId: String(r.outlet_id),
    paymentMethod: String(r.payment_method),
    total: Number(r.total),
    lines,
    createdAt: Number(r.created_at),
    synced: Boolean(r.synced),
    saleNo: r.sale_no != null ? String(r.sale_no) : undefined,
    serverSaleId: r.server_sale_id != null ? String(r.server_sale_id) : undefined,
    status: r.status != null ? String(r.status) : undefined,
    rejectionReason: r.rejection_reason != null ? String(r.rejection_reason) : undefined,
  }
}

/** @param {Record<string, unknown>} r */
function mapStockBfRow(r) {
  let lines = []
  try {
    lines = JSON.parse(String(r.lines_json ?? '[]'))
  } catch { /* ignore */ }
  return {
    id: String(r.id),
    outletId: String(r.outlet_id),
    processDate: String(r.process_date),
    lines,
    createdAt: Number(r.created_at),
    synced: Boolean(r.synced),
  }
}

export function registerSqliteIpc() {
  ipcMain.handle('offline:op', async (_evt, req) => {
    const op = req?.op
    if (typeof op !== 'string' || !ALLOWED.has(op)) {
      throw new Error(`Invalid offline op: ${op}`)
    }
    const d = openDb()
    return dispatch(d, op, req.payload)
  })
}

export function closeSqliteDb() {
  if (db) {
    try {
      db.close()
    } catch { /* ignore */ }
    db = null
  }
}
