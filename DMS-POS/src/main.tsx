import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyBootstrapConfig, repairStaleLocalApiUrl } from './lib/bootstrap-config'
import { initOfflineStorage } from './lib/offline-db'
import { useSettingsStore } from './lib/settings-store'

const rootEl = document.getElementById('root')!

async function bootstrap() {
  await initOfflineStorage()
  await useSettingsStore.persist.rehydrate()
  await applyBootstrapConfig()
  repairStaleLocalApiUrl()
}

void bootstrap()
  .catch((e) => {
    console.error('[DMS-POS] Bootstrap failed', e)
  })
  .finally(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
