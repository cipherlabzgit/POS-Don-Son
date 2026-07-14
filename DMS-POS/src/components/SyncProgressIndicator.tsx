import { useSyncProgressStore } from '../lib/sync-progress-store'

export function SyncProgressIndicator() {
  const { isSyncing, currentItem, totalItems, currentType } = useSyncProgressStore()

  if (!isSyncing || totalItems === 0) return null

  const percentage = Math.round((currentItem / totalItems) * 100)

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-blue-200 bg-white p-4 shadow-2xl" style={{ minWidth: '280px' }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-blue-900">Syncing...</span>
        <span className="text-xs font-semibold text-blue-700">{percentage}%</span>
      </div>
      
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-blue-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-600">
        {currentType && <span className="font-mono text-blue-600">{currentType}</span>}
        {' '}
        {currentItem} of {totalItems} items
      </div>
    </div>
  )
}
