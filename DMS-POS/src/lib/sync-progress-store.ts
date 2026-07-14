import { create } from 'zustand'

interface SyncProgressState {
  isSyncing: boolean
  currentItem: number
  totalItems: number
  currentType: string | null
  
  startSync: (total: number) => void
  updateProgress: (current: number, type?: string) => void
  endSync: () => void
}

export const useSyncProgressStore = create<SyncProgressState>((set) => ({
  isSyncing: false,
  currentItem: 0,
  totalItems: 0,
  currentType: null,

  startSync: (total: number) =>
    set({
      isSyncing: true,
      currentItem: 0,
      totalItems: total,
      currentType: null,
    }),

  updateProgress: (current: number, type?: string) =>
    set((state) => ({
      currentItem: current,
      currentType: type ?? state.currentType,
    })),

  endSync: () =>
    set({
      isSyncing: false,
      currentItem: 0,
      totalItems: 0,
      currentType: null,
    }),
}))
