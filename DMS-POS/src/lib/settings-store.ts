import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Matches DMS-Backend `Properties/launchSettings.json` http profile */
export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5126'

interface ThemeColors {
  primaryColor: string
  primaryLight: string
  primaryDark: string
  accentColor: string
  accentLight: string
  accentDark: string
  categoryColors?: string[]
}

interface SettingsState {
  apiBaseUrl: string
  outletId: string | null
  outletLabel: string
  zoomPercent: number
  cacheUpdatedAt: number | null
  /** When true, print receipt automatically after a successful payment */
  autoPrint: boolean
  receiptPhone: string
  receiptAddress: string
  themeColors: ThemeColors | null
  setApiBaseUrl: (url: string) => void
  setOutlet: (id: string | null, label: string) => void
  setZoomPercent: (p: number) => void
  setCacheUpdatedAt: (t: number | null) => void
  setAutoPrint: (v: boolean) => void
  setReceiptPhone: (v: string) => void
  setReceiptAddress: (v: string) => void
  setThemeColors: (colors: ThemeColors) => void
  applyThemeColors: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      outletId: null,
      outletLabel: 'Showroom',
      zoomPercent: 100,
      cacheUpdatedAt: null,
      autoPrint: false,
      receiptPhone: '',
      receiptAddress: '',
      themeColors: null,

      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setOutlet: (outletId, outletLabel) => set({ outletId, outletLabel }),
      setZoomPercent: (zoomPercent) =>
        set({ zoomPercent: Math.min(120, Math.max(70, Math.round(zoomPercent))) }),
      setCacheUpdatedAt: (cacheUpdatedAt) => set({ cacheUpdatedAt }),
      setAutoPrint: (autoPrint) => set({ autoPrint }),
      setReceiptPhone: (receiptPhone) => set({ receiptPhone: receiptPhone }),
      setReceiptAddress: (receiptAddress) => set({ receiptAddress }),
      setThemeColors: (themeColors) => {
        set({ themeColors })
        get().applyThemeColors()
      },
      applyThemeColors: () => {
        const colors = get().themeColors
        if (!colors) {
          console.log('[theme] No theme colors to apply, using defaults')
          return
        }
        
        console.log('[theme] Applying theme colors:', colors)
        const root = document.documentElement
        
        // Core brand colors
        root.style.setProperty('--brand-primary', colors.primaryColor)
        root.style.setProperty('--brand-primary-light', colors.primaryLight)
        root.style.setProperty('--brand-primary-dark', colors.primaryDark)
        root.style.setProperty('--brand-accent', colors.accentColor)
        root.style.setProperty('--brand-accent-light', colors.accentLight)
        root.style.setProperty('--brand-accent-dark', colors.accentDark)
        
        // POS-specific surfaces
        root.style.setProperty('--pos-header-bg', colors.primaryColor)
        root.style.setProperty('--pos-header-border', colors.primaryDark)
        root.style.setProperty('--pos-header-text', '#ffffff')
        
        // Category pill colors - all 8 tabs (customizable by admin)
        const defaultCategoryColors = [
          colors.accentColor,    // gold (accent)
          colors.primaryColor,   // red (primary)
          '#16a34a',             // green
          '#1d4ed8',             // blue
          '#9333ea',             // purple
          '#ea580c',             // orange
          '#db2777',             // pink
          '#0891b2'              // teal
        ]
        
        const categoryColors = colors.categoryColors && colors.categoryColors.length >= 8 
          ? colors.categoryColors 
          : defaultCategoryColors
        
        categoryColors.forEach((color, index) => {
          root.style.setProperty(`--cat-${index}`, color)
        })
        
        // Button colors
        root.style.setProperty('--btn-primary-bg', colors.primaryColor)
        root.style.setProperty('--btn-primary-hover', colors.primaryDark)
        root.style.setProperty('--btn-accent-bg', colors.accentColor)
        root.style.setProperty('--btn-accent-hover', colors.accentDark)
        
        // Interactive elements
        root.style.setProperty('--ring', colors.primaryColor)
        
        console.log('[theme] Theme colors applied successfully')
      },
    }),
    {
      name: 'dms-pos-settings',
      version: 6,
      migrate: (persisted: unknown, version: number) => {
        const wrongPorts = ['http://localhost:5000', 'http://127.0.0.1:5000']
        const localhostApi = ['http://localhost:5126', 'http://localhost:5126/']
        if (version < 2 && persisted && typeof persisted === 'object' && 'state' in persisted) {
          const s = (persisted as { state: Partial<SettingsState> }).state
          const url = s?.apiBaseUrl
          if (url && wrongPorts.includes(url.replace(/\/$/, ''))) {
            return {
              ...(persisted as object),
              state: { ...s, apiBaseUrl: DEFAULT_API_BASE_URL },
            }
          }
        }
        if (version < 3 && persisted && typeof persisted === 'object' && 'state' in persisted) {
          const s = (persisted as { state: Partial<SettingsState> }).state
          return {
            ...(persisted as object),
            state: {
              ...s,
              autoPrint: s.autoPrint ?? false,
              receiptPhone: s.receiptPhone ?? '',
              receiptAddress: s.receiptAddress ?? '',
            },
          }
        }
        if (version < 4 && persisted && typeof persisted === 'object' && 'state' in persisted) {
          const s = (persisted as { state: Partial<SettingsState> }).state
          return {
            ...(persisted as object),
            state: {
              ...s,
              themeColors: s.themeColors ?? null,
            },
          }
        }
        if (version < 5 && persisted && typeof persisted === 'object' && 'state' in persisted) {
          // Version 5: categoryColors support added to theme
          // Existing theme data will be preserved, categoryColors will be fetched on next sync
          return persisted
        }
        if (version < 6 && persisted && typeof persisted === 'object' && 'state' in persisted) {
          const s = (persisted as { state: Partial<SettingsState> }).state
          const url = s?.apiBaseUrl?.replace(/\/$/, '')
          if (url && localhostApi.some((bad) => bad.replace(/\/$/, '') === url)) {
            return {
              ...(persisted as object),
              state: { ...s, apiBaseUrl: 'http://127.0.0.1:5126' },
            }
          }
        }
        return persisted
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
