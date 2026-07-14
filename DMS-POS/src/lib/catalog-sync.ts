import { fetchCategoriesPage, fetchProductsPage } from './api'
import { offlineDb, replaceOfflineCatalog } from './offline-db'
import { useSettingsStore } from './settings-store'
import type { CategoryRow, ProductRow } from './types'

function mapProduct(p: Record<string, unknown>): ProductRow {
  const ros = p.requireOpenStock ?? p.RequireOpenStock
  return {
    id: String(p.id),
    code: String(p.code ?? ''),
    name: String(p.name ?? ''),
    unitPrice: Number(p.unitPrice ?? 0),
    categoryId: String(p.categoryId ?? ''),
    categoryName: String(p.categoryName ?? ''),
    sortOrder: Number(p.sortOrder ?? p.SortOrder ?? 0),
    requireOpenStock: ros === undefined || ros === null ? true : Boolean(ros),
  }
}

function mapCategory(c: Record<string, unknown>): CategoryRow {
  return {
    id: String(c.id),
    name: String(c.name ?? ''),
    code: c.code != null ? String(c.code) : undefined,
    sortOrder: Number(c.sortOrder ?? 0),
  }
}

export async function syncCatalogFromServer(): Promise<void> {
  const pageSize = 200

  let page = 1
  let totalCount = 0
  const prods: ProductRow[] = []
  do {
    const res = await fetchProductsPage(page, pageSize)
    totalCount = res.totalCount
    prods.push(...(res.products as Record<string, unknown>[]).map(mapProduct))
    page += 1
  } while (prods.length < totalCount)

  page = 1
  totalCount = 0
  const cats: CategoryRow[] = []
  do {
    const res = await fetchCategoriesPage(page, pageSize)
    totalCount = res.totalCount
    cats.push(...(res.categories as Record<string, unknown>[]).map(mapCategory))
    page += 1
  } while (cats.length < totalCount)

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
