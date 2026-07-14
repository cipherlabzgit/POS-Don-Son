import axios from 'axios'
import { offlineDb } from './offline-db'
import {
  postPosSale,
  postPosSalesBulk,
  postStockBfBulk,
  createTransfer,
  submitTransfer,
  createDeliveryReturn,
  submitDeliveryReturn,
  submitCashierBalance,
} from './api'
import { localLinesFromPosSaleApi, parsePosSaleDetailPayload } from './pos-sale-response'
import { toast } from './toast-store'
import { useSyncProgressStore } from './sync-progress-store'
import type { PendingMutation } from './types'

const MAX_RETRIES = 5
const BATCH_SIZE = 10 // Process up to 10 sales in one batch
let queueRunning = false

function isStockBfAlreadyExistsError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409
}

export async function enqueueMutation(m: Omit<PendingMutation, 'retryCount'>): Promise<void> {
  await offlineDb.pending.put({ ...m, retryCount: 0 })
}

export async function processPendingQueue(isOnline: boolean): Promise<void> {
  if (!isOnline || queueRunning) return
  queueRunning = true
  try {
    const rows = await offlineDb.pending.orderBy('createdAt').toArray()
    
    // Start sync progress tracking
    if (rows.length > 0) {
      useSyncProgressStore.getState().startSync(rows.length)
    }

    let i = 0
    let processedCount = 0
    while (i < rows.length) {
      const row = rows[i]

      // Check max retries
      if (row.retryCount >= MAX_RETRIES) {
        await offlineDb.droppedMutations.put({
          id: row.id,
          type: row.type,
          payload: row.payload,
          createdAt: row.createdAt,
          droppedAt: Date.now(),
          retryCount: row.retryCount,
        })
        await offlineDb.pending.delete(row.id)
        toast(
          `A ${row.type} record could not be synced after ${MAX_RETRIES} attempts and was dropped. Contact your administrator.`,
          'error',
        )
        i++
        processedCount++
        useSyncProgressStore.getState().updateProgress(processedCount, row.type)
        continue
      }

      // Batch process pos-sales
      if (row.type === 'pos-sale') {
        // Collect consecutive pos-sale items (up to BATCH_SIZE, all under max retries)
        const batch = [row]
        let j = i + 1
        while (j < rows.length && batch.length < BATCH_SIZE && rows[j].type === 'pos-sale' && rows[j].retryCount < MAX_RETRIES) {
          batch.push(rows[j])
          j++
        }

        try {
          if (batch.length === 1) {
            // Single sale - use regular endpoint
            const result = await postPosSale(row.payload as object)
            const detail = parsePosSaleDetailPayload(result)
            const linesPatch =
              detail.lines?.length && detail.lines.some((l) => l.productId != null && String(l.productId))
                ? localLinesFromPosSaleApi(detail.lines)
                : undefined
            await offlineDb.sales.update(row.id, {
              synced: true,
              saleNo: detail.saleNo,
              serverSaleId: detail.serverSaleId,
              status: detail.status,
              rejectionReason: detail.rejectionReason,
              ...(linesPatch ? { lines: linesPatch } : {}),
            })
            await offlineDb.pending.delete(row.id)
          } else {
            // Batch sales - use bulk endpoint
            const result = (await postPosSalesBulk(batch.map((b) => b.payload as object))) as {
              sales?: Array<Record<string, unknown>>
              errors?: Array<{ clientMutationId?: string; message?: string }>
            }

            // Process successful sales
            if (result.sales) {
              for (const saleData of result.sales) {
                const detail = parsePosSaleDetailPayload(saleData)
                const localId = batch.find((b) => {
                  const payload = b.payload as { clientMutationId?: string }
                  return payload.clientMutationId === detail.serverSaleId
                })?.id || batch.find((b) => b.id === detail.serverSaleId)?.id

                if (localId) {
                  const linesPatch =
                    detail.lines?.length && detail.lines.some((l) => l.productId != null && String(l.productId))
                      ? localLinesFromPosSaleApi(detail.lines)
                      : undefined
                  await offlineDb.sales.update(localId, {
                    synced: true,
                    saleNo: detail.saleNo,
                    serverSaleId: detail.serverSaleId,
                    status: detail.status,
                    rejectionReason: detail.rejectionReason,
                    ...(linesPatch ? { lines: linesPatch } : {}),
                  })
                  await offlineDb.pending.delete(localId)
                }
              }
            }

            // Handle errors - increment retry for failed items
            if (result.errors && result.errors.length > 0) {
              for (const error of result.errors) {
                const failedItem = batch.find((b) => {
                  const payload = b.payload as { clientMutationId?: string }
                  return payload.clientMutationId === error.clientMutationId
                })
                if (failedItem) {
                  await offlineDb.pending.update(failedItem.id, { retryCount: failedItem.retryCount + 1 })
                }
              }
              toast(`${result.errors.length} sale(s) failed to sync. Will retry.`, 'info')
            }
          }

          processedCount += (j - i)
          useSyncProgressStore.getState().updateProgress(processedCount, 'pos-sale')
          i = j // Move past all processed batch items
        } catch (err) {
          // Batch failed - increment retry for all items in batch
          let authDrop = false
          if (axios.isAxiosError(err)) {
            const s = err.response?.status
            if (s === 401 || s === 403) {
              authDrop = true
              toast(
                s === 401
                  ? 'Session expired — sign in again. Queued sales could not be synced.'
                  : 'Permission denied — queued sales were removed.',
                'error',
              )
            }
          }

          for (const item of batch) {
            if (authDrop) {
              await offlineDb.droppedMutations.put({
                id: item.id,
                type: item.type,
                payload: item.payload,
                createdAt: item.createdAt,
                droppedAt: Date.now(),
                retryCount: item.retryCount,
              })
              await offlineDb.pending.delete(item.id)
            } else {
              await offlineDb.pending.update(item.id, { retryCount: item.retryCount + 1 })
            }
          }

          if (authDrop) {
            break // Stop processing queue on auth failure
          }

          i = j // Move past batch even on error
        }
        continue // Skip individual processing below
      }

      // Non-batch processing for other types
      try {
        switch (row.type) {
          case 'stock-bf-bulk': {
            try {
              await postStockBfBulk(row.payload as object)
            } catch (err) {
              if (!isStockBfAlreadyExistsError(err)) throw err
            }
            await offlineDb.stockBf.update(row.id, { synced: true })
            break
          }

          case 'transfer': {
            const payload = row.payload as Parameters<typeof createTransfer>[0] & { submitAfter?: boolean }
            const created = await createTransfer(payload) as { id?: string }
            if (payload.submitAfter && created?.id) {
              await submitTransfer(String(created.id))
            }
            break
          }

          case 'delivery-return': {
            const payload = row.payload as Parameters<typeof createDeliveryReturn>[0] & { submitAfter?: boolean }
            const created = await createDeliveryReturn(payload) as { id?: string }
            if (payload.submitAfter && created?.id) {
              await submitDeliveryReturn(String(created.id))
            }
            break
          }

          case 'cashier-balance': {
            await submitCashierBalance(row.payload as Parameters<typeof submitCashierBalance>[0])
            break
          }

          default:
            await offlineDb.droppedMutations.put({
              id: row.id,
              type: String(row.type),
              payload: row.payload,
              createdAt: row.createdAt,
              droppedAt: Date.now(),
              retryCount: row.retryCount,
            })
            await offlineDb.pending.delete(row.id)
            toast(
              `Unknown queued action "${String(row.type)}" was discarded. Contact support if this persists.`,
              'error',
            )
            continue
        }

        await offlineDb.pending.delete(row.id)
        processedCount++
        useSyncProgressStore.getState().updateProgress(processedCount, row.type)
        i++ // Move to next item
      } catch (err) {
        let authDrop = false
        if (axios.isAxiosError(err)) {
          const s = err.response?.status
          if (s === 401 || s === 403) {
            authDrop = true
            toast(
              s === 401
                ? 'Session expired — sign in again. A queued change could not be synced.'
                : 'Permission denied — a queued change was removed.',
              'error',
            )
          }
        }
        if (authDrop) {
          await offlineDb.droppedMutations.put({
            id: row.id,
            type: row.type,
            payload: row.payload,
            createdAt: row.createdAt,
            droppedAt: Date.now(),
            retryCount: row.retryCount,
          })
          await offlineDb.pending.delete(row.id)
          // Auth failure is global — no point trying remaining items this run
          break
        }
        // Network/server error on this item — increment retry and try next item
        await offlineDb.pending.update(row.id, { retryCount: row.retryCount + 1 })
        i++ // Move to next item even on error
      }
    }
  } finally {
    queueRunning = false
    useSyncProgressStore.getState().endSync()
  }
}
