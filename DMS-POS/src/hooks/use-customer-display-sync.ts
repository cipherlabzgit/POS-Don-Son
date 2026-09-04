import { useEffect } from 'react'
import { useCartStore } from '../lib/cart-store'

export function useCustomerDisplaySync() {
  useEffect(() => {
    const push = () => {
      const lines = useCartStore.getState().lines
      const total = useCartStore.getState().subtotal()
      window.dmsPos?.pushCustomerCart?.({
        lines: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
        total,
      })
    }
    push()
    return useCartStore.subscribe(push)
  }, [])
}

export function pushCustomerThankYou(change: number) {
  window.dmsPos?.pushCustomerCart?.({
    lines: [],
    total: 0,
    change,
    thankYou: true,
  })
}
