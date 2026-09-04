import { useState, useEffect } from 'react'
import { PosMainPage } from './pages/PosMainPage'
import { LoginPage } from './pages/LoginPage'
import { StockBfPage } from './pages/StockBfPage'
import { PendingTransfersPage } from './pages/PendingTransfersPage'
import { CustomerViewPage, isCustomerDisplayWindow } from './pages/CustomerViewPage'
import { useCustomerDisplaySync } from './hooks/use-customer-display-sync'
import { NewTransferPage } from './pages/NewTransferPage'
import { DeliveryReturnPage } from './pages/DeliveryReturnPage'
import { CashSubmissionPage } from './pages/CashSubmissionPage'
import { OrderRequestPage } from './pages/OrderRequestPage'
import { NetworkDiagnosticsPage } from './pages/NetworkDiagnosticsPage'
import { PosAccessDeniedPage } from './pages/PosAccessDeniedPage'
import { IdleLogoutBanner } from './components/IdleLogoutBanner'
import { ToastHost } from './components/ToastHost'
import { useIdleLogout } from './hooks/use-idle-logout'
import { SyncProgressIndicator } from './components/SyncProgressIndicator'
import { useAuthStore } from './lib/auth-store'
import { useSettingsStore } from './lib/settings-store'
import { syncThemeFromServer } from './lib/theme-sync'
import { useOnlineStatus } from './lib/use-online-status'
import type { Screen } from './screen-types'

export default function App() {
  if (isCustomerDisplayWindow()) {
    return <CustomerViewPage standalone />
  }

  return <CashierApp />
}

function CashierApp() {
  useCustomerDisplaySync()
  const token = useAuthStore((s) => s.accessToken)
  const tillReady = useSettingsStore((s) => Boolean(s.assignedShowroomCode.trim()))
  const online = useOnlineStatus(Boolean(token))
  const [screen, setScreen] = useState<Screen>('pos')
  const idle = useIdleLogout(Boolean(token))

  // Apply theme colors on mount and when theme changes
  useEffect(() => {
    useSettingsStore.getState().applyThemeColors()
  }, [])

  useEffect(() => {
    if (!token) setScreen('pos')
  }, [token])

  useEffect(() => {
    void window.dmsPos?.isFullscreen?.().then((full) => {
      if (!full) void window.dmsPos?.toggleFullscreen?.()
    })
  }, [])

  // Sync theme from server when authenticated (useOnlineStatus already handles sync)
  // This is a backup in case the hook doesn't trigger
  useEffect(() => {
    if (token && online) {
      const timer = setTimeout(() => {
        syncThemeFromServer()
          .then(() => console.log('[app] Theme synced successfully'))
          .catch(err => console.error('[app] Theme sync failed:', err))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [token, online])

  if (!tillReady) {
    return (
      <>
        <ToastHost />
        <PosAccessDeniedPage onReady={() => undefined} />
      </>
    )
  }

  if (!token) {
    return (
      <>
        <ToastHost />
        <LoginPage />
      </>
    )
  }

  return (
    <>
      <ToastHost />
      {idle.warning ? (
        <IdleLogoutBanner
          secondsLeft={idle.secondsLeft}
          onStay={idle.staySignedIn}
          onLogout={idle.logoutNow}
        />
      ) : null}
      <SyncProgressIndicator />
      {screen === 'pos' ? (
        <PosMainPage
          onOpenScreen={(s: Screen) => setScreen(s)}
        />
      ) : null}
      {screen === 'stock-bf' ? <StockBfPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'transfers' ? <PendingTransfersPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'transfer' ? <NewTransferPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'return' ? <DeliveryReturnPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'cash' ? <CashSubmissionPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'order-request' ? <OrderRequestPage onBack={() => setScreen('pos')} /> : null}
      {screen === 'diagnostics' ? <NetworkDiagnosticsPage onBack={() => setScreen('pos')} /> : null}
    </>
  )
}
