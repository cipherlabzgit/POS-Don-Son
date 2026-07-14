import { create } from 'zustand'

type ToastLevel = 'success' | 'error' | 'info'

interface ToastState {
  message: string | null
  level: ToastLevel
  show: (message: string, level?: ToastLevel) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  level: 'info',
  show: (message, level = 'info') => {
    set({ message, level })
    window.setTimeout(() => set({ message: null }), 4500)
  },
  clear: () => set({ message: null }),
}))

export function toast(message: string, level: ToastLevel = 'info') {
  useToastStore.getState().show(message, level)
}
