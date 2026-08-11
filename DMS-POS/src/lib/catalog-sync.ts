import { fetchCategoriesPage, fetchProductsPage } from './api'
import { formatSubmitError } from './api-errors'
import { offlineDb, replaceOfflineCatalog } from './offline-db'
import { useSettingsStore } from './settings-store'
import type { CategoryRow, ProductRow } from './types'

function readList<T>(payload: Record<string, unknown>, camel: string, pascal: string): T[] {
  const value = payload[camel] ?? payload[pascal]
  return Array.isArray(value) ? (value as T[]) : []
}

function readCount(payload: Record<string, unknown>, camel: string, pascal: string): number {
  const value = payload[camel] ?? payload[pascal]
  return typeof value === 'number' ? value : Number(value ?? 0)
}

function mapProduct(p: Record<string, unknown>): ProductRow {
  const ros = p.requireOpenStock ?? p.RequireOpenStock
  return {
    id: String(p.id ?? p.Id ?? ''),
    code: String(p.code ?? p.Code ?? ''),
    name: String(p.name ?? p.Name ?? ''),
    unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? 0),
    categoryId: String(p.categoryId ?? p.CategoryId ?? ''),
    categoryName: String(p.categoryName ?? p.CategoryName ?? ''),
    sortOrder: Number(p.sortOrder ?? p.SortOrder ?? 0),
    requireOpenStock: ros === undefined || ros === null ? true : Boolean(ros),
  }
}

function mapCategory(c: Record<string, unknown>): CategoryRow {
  return {
    id: String(c.id ?? c.Id ?? ''),
    name: String(c.name ?? c.Name ?? ''),
    code: c.code != null ? String(c.code) : c.Code != null ? String(c.Code) : undefined,
    sortOrder: Number(c.sortOrder ?? c.SortOrder ?? 0),
  }
}

export async function syncCatalogFromServer(): Promise<void> {
  const pageSize = 200
  const maxPages = 50

  let page = 1
  let totalCount = 0
  const prods: ProductRow[] = []
  try {
    do {
      const res = await fetchProductsPage(page, pageSize) as Record<string, unknown>
      totalCount = readCount(res, 'totalCount', 'TotalCount')
      const batch = readList<Record<string, unknown>>(res, 'products', 'Products').map(mapProduct)
      if (totalCount > 0 && batch.length === 0) {
        throw new Error(
          'Server reported products but returned an empty page. Log out, check Server URL, and try again.',
        )
      }
      prods.push(...batch)
      page += 1
    } while (prods.length < totalCount && page <= maxPages)
    if (prods.length < totalCount) {
      throw new Error(
        `Catalogue download incomplete (${prods.length} of ${totalCount}). Check network and re-sync.`,
      )
    }
  } catch (err) {
    throw new Error(formatSubmitError(err))
  }

  page = 1
  totalCount = 0
  const cats: CategoryRow[] = []
  try {
    do {
      const res = await fetchCategoriesPage(page, pageSize) as Record<string, unknown>
      totalCount = readCount(res, 'totalCount', 'TotalCount')
      const batch = readList<Record<string, unknown>>(res, 'categories', 'Categories').map(mapCategory)
      if (totalCount > 0 && batch.length === 0) {
        throw new Error(
          'Server reported categories but returned an empty page. Log out, check Server URL, and try again.',
        )
      }
      cats.push(...batch)
      page += 1
    } while (cats.length < totalCount && page <= maxPages)
    if (cats.length < totalCount) {
      throw new Error(
        `Category download incomplete (${cats.length} of ${totalCount}). Check network and re-sync.`,
      )
    }
  } catch (err) {
    throw new Error(formatSubmitError(err))
  }

  if (prods.length === 0) {
    const existingProducts = await offlineDb.products.toArray()
    if (existingProducts.length > 0) {
      console.warn('[catalog-sync] Server returned 0 products; keeping existing local cache.')
      return
    }
    throw new Error(
      'Server returned 0 products. On the server run: .\\scripts\\fix-pos-catalog.ps1 then log out and log in again.',
    )
  }

  await replaceOfflineCatalog(prods, cats)

  useSettingsStore.getState().setCacheUpdatedAt(Date.now())
}

export async function loadProductsIntoDb(): Promise<ProductRow[]> {
  const local = await offlineDb.products.toArray()
  if (local.length > 0) return local
  await syncCatalogFromServer()
  return offlineDb.products.toArray()
}

export async function loadCategoriesIntoDb(): Promise<CategoryRow[]> {
  const local = await offlineDb.categories.toArray()
  if (local.length > 0) return local
  await syncCatalogFromServer()
  return offlineDb.categories.toArray()
}
