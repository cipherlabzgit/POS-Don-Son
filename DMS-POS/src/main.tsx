import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initOfflineStorage } from './lib/offline-db'

const rootEl = document.getElementById('root')!

void initOfflineStorage()
  .catch((e) => {
    console.error('[DMS-POS] Offline storage init failed', e)
  })
  .finally(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
