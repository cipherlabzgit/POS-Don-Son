import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CheckCircle2, XCircle, Loader2, Server, Globe } from 'lucide-react'
import { useSettingsStore } from '../lib/settings-store'
import { PosSubPageLayout } from '../components/PosSubPageLayout'
import axios from 'axios'
import { offlineDb } from '../lib/offline-db'

interface DiagnosticResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'running'
  message: string
  details?: string
  duration?: number
}

interface NetworkDiagnosticsPageProps {
  onBack: () => void
}

export function NetworkDiagnosticsPage({ onBack }: NetworkDiagnosticsPageProps) {
  const { apiBaseUrl, outletId, outletLabel } = useSettingsStore()
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning'>('warning')

  const updateResult = (name: string, updates: Partial<DiagnosticResult>) => {
    setResults((prev) =>
      prev.map((r) => (r.name === name ? { ...r, ...updates } : r)),
    )
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setOverallStatus('warning')

    const tests: DiagnosticResult[] = [
      { name: 'Browser Online Status', status: 'pending', message: '' },
      { name: 'Server Reachability', status: 'pending', message: '' },
      { name: 'API Health Check', status: 'pending', message: '' },
      { name: 'Authentication', status: 'pending', message: '' },
      { name: 'Database Connection', status: 'pending', message: '' },
      { name: 'Products Cache', status: 'pending', message: '' },
      { name: 'Pending Queue', status: 'pending', message: '' },
    ]

    setResults(tests)

    // Test 1: Browser Online Status
    const startTime1 = Date.now()
    updateResult('Browser Online Status', { status: 'running' })
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    const isOnline = navigator.onLine
    updateResult('Browser Online Status', {
      status: isOnline ? 'success' : 'error',
      message: isOnline ? 'Connected' : 'Offline',
      details: isOnline
        ? 'Browser reports network connection available'
        : 'No network connection detected',
      duration: Date.now() - startTime1,
    })

    // Test 2: Server Reachability (basic fetch)
    const startTime2 = Date.now()
    updateResult('Server Reachability', { status: 'running' })
    
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      await fetch(apiBaseUrl + '/health', {
        signal: controller.signal,
        mode: 'no-cors', // Try no-cors first to check if server is up
      })
      
      clearTimeout(timeout)
      
      updateResult('Server Reachability', {
        status: 'success',
        message: 'Server is reachable',
        details: `${apiBaseUrl} responded`,
        duration: Date.now() - startTime2,
      })
    } catch (err: unknown) {
      const error = err as Error
      updateResult('Server Reachability', {
        status: 'error',
        message: 'Cannot reach server',
        details: error.name === 'AbortError' 
          ? 'Connection timeout (>5s)' 
          : `Error: ${error.message}`,
        duration: Date.now() - startTime2,
      })
    }

    // Test 3: API Health Check (with CORS)
    const startTime3 = Date.now()
    updateResult('API Health Check', { status: 'running' })
    
    try {
      const response = await axios.get(apiBaseUrl + '/health', {
        timeout: 5000,
      })
      
      updateResult('API Health Check', {
        status: response.status === 200 ? 'success' : 'error',
        message: response.status === 200 ? 'API is healthy' : 'API returned error',
        details: `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`,
        duration: Date.now() - startTime3,
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const isCors = err.message.includes('Network Error') || err.code === 'ERR_NETWORK'
        
        updateResult('API Health Check', {
          status: 'error',
          message: isCors ? 'CORS Error' : `HTTP ${status || 'Error'}`,
          details: isCors
            ? 'Server may not allow requests from this origin. Check backend CORS config.'
            : `${err.message} - ${err.response?.data?.message || ''}`,
          duration: Date.now() - startTime3,
        })
      } else {
        updateResult('API Health Check', {
          status: 'error',
          message: 'Request failed',
          details: String(err),
          duration: Date.now() - startTime3,
        })
      }
    }

    // Test 4: Authentication
    const startTime4 = Date.now()
    updateResult('Authentication', { status: 'running' })
    
    const token = localStorage.getItem('dms-pos-auth-token')
    if (!token) {
      updateResult('Authentication', {
        status: 'error',
        message: 'Not authenticated',
        details: 'No auth token found. Please log in.',
        duration: Date.now() - startTime4,
      })
    } else {
      try {
        // Try a simple authenticated request
        const response = await axios.get(apiBaseUrl + '/api/pos-sales', {
          params: { page: 1, pageSize: 1 },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        })
        
        updateResult('Authentication', {
          status: response.status === 200 ? 'success' : 'error',
          message: response.status === 200 ? 'Authenticated' : 'Auth failed',
          details: `Token valid. Status: ${response.status}`,
          duration: Date.now() - startTime4,
        })
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          updateResult('Authentication', {
            status: 'error',
            message: status === 401 ? 'Token expired' : 'Auth error',
            details: status === 401 
              ? 'Your session has expired. Please log in again.'
              : `HTTP ${status}: ${err.response?.data?.message || err.message}`,
            duration: Date.now() - startTime4,
          })
        }
      }
    }

    // Test 5: Database Connection
    const startTime5 = Date.now()
    updateResult('Database Connection', { status: 'running' })
    
    try {
      await offlineDb.products.toArray()
      updateResult('Database Connection', {
        status: 'success',
        message: 'Database OK',
        details: 'SQLite connection working',
        duration: Date.now() - startTime5,
      })
    } catch (err: unknown) {
      updateResult('Database Connection', {
        status: 'error',
        message: 'Database error',
        details: String(err),
        duration: Date.now() - startTime5,
      })
    }

    // Test 6: Products Cache
    const startTime6 = Date.now()
    updateResult('Products Cache', { status: 'running' })
    
    try {
      const products = await offlineDb.products.toArray()
      const categories = await offlineDb.categories.toArray()
      
      updateResult('Products Cache', {
        status: products.length > 0 ? 'success' : 'error',
        message: products.length > 0 ? 'Products cached' : 'No products',
        details: `${products.length} products, ${categories.length} categories`,
        duration: Date.now() - startTime6,
      })
    } catch (err: unknown) {
      updateResult('Products Cache', {
        status: 'error',
        message: 'Cache error',
        details: String(err),
        duration: Date.now() - startTime6,
      })
    }

    // Test 7: Pending Queue
    const startTime7 = Date.now()
    updateResult('Pending Queue', { status: 'running' })
    
    try {
      const pending = await offlineDb.pending.toArray()
      const dropped = await offlineDb.droppedMutations.toArray()
      
      updateResult('Pending Queue', {
        status: pending.length === 0 && dropped.length === 0 ? 'success' : 'error',
        message: pending.length === 0 ? 'Queue empty' : `${pending.length} pending`,
        details: `Pending: ${pending.length}, Dropped: ${dropped.length}`,
        duration: Date.now() - startTime7,
      })
    } catch (err: unknown) {
      updateResult('Pending Queue', {
        status: 'error',
        message: 'Queue error',
        details: String(err),
        duration: Date.now() - startTime7,
      })
    }

    setIsRunning(false)
    
    // Determine overall status
    setResults((prev) => {
      const hasError = prev.some((r) => r.status === 'error')
      setOverallStatus(hasError ? 'error' : 'success')
      return prev
    })
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const StatusIcon = ({ status }: { status: DiagnosticResult['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
    }
  }

  return (
    <PosSubPageLayout title="Network Diagnostics" onBack={onBack}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Overall Status */}
        <div
          className={`mb-6 p-4 rounded-lg border-2 ${
            overallStatus === 'success'
              ? 'bg-green-50 border-green-300'
              : overallStatus === 'error'
              ? 'bg-red-50 border-red-300'
              : 'bg-gray-50 border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {overallStatus === 'success' ? (
              <Wifi className="w-8 h-8 text-green-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-lg font-bold">
                {overallStatus === 'success'
                  ? 'All Systems Operational'
                  : overallStatus === 'error'
                  ? 'Issues Detected'
                  : 'Running Diagnostics...'}
              </h2>
              <p className="text-sm text-gray-600">
                POS is {navigator.onLine ? 'online' : 'offline'} | Outlet:{' '}
                {outletLabel || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Configuration
          </h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>API URL:</strong>{' '}
              <code className="bg-white px-2 py-1 rounded">{apiBaseUrl}</code>
            </p>
            <p>
              <strong>Outlet ID:</strong>{' '}
              <code className="bg-white px-2 py-1 rounded">
                {outletId || 'Not set'}
              </code>
            </p>
            <p>
              <strong>Outlet:</strong> {outletLabel || 'Not set'}
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.name}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <StatusIcon status={result.status} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{result.name}</h4>
                    {result.duration && (
                      <span className="text-xs text-gray-500">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      result.status === 'error'
                        ? 'text-red-700'
                        : result.status === 'success'
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Running...
              </span>
            ) : (
              'Run Diagnostics Again'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Troubleshooting Tips
          </h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>
              <strong>Server Reachability Failed:</strong> Check internet
              connection and firewall settings
            </li>
            <li>
              <strong>CORS Error:</strong> Backend CORS configuration may not
              allow this origin. Contact administrator.
            </li>
            <li>
              <strong>Authentication Failed:</strong> Log out and log in again
              to refresh your session.
            </li>
            <li>
              <strong>No Products:</strong> Click &quot;Sync Catalog&quot; from
              main screen or re-login.
            </li>
            <li>
              <strong>Pending Queue:</strong> Items will sync automatically when
              online. Wait 60 seconds or reconnect.
            </li>
          </ul>
        </div>
      </div>
    </PosSubPageLayout>
  )
}
