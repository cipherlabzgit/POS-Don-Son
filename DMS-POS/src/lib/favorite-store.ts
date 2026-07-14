import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FavState {
  ids: string[]
  toggle: (productId: string) => void
  isFav: (productId: string) => boolean
}

export const useFavoriteStore = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((s) => ({
          ids: s.ids.includes(productId)
            ? s.ids.filter((x) => x !== productId)
            : [...s.ids, productId],
        })),
      isFav: (productId) => get().ids.includes(productId),
    }),
    { name: 'dms-pos-fav', storage: createJSONStorage(() => localStorage) },
  ),
)
