import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const execFileAsync = promisify(execFile)

function poleConfigPath() {
  return path.join(app.getPath('userData'), 'pole-display.json')
}

export function loadPoleConfig() {
  try {
    const raw = fs.readFileSync(poleConfigPath(), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      port: String(parsed.port || '').trim(),
      baud: Number(parsed.baud || 9600),
    }
  } catch {
    return { port: '', baud: 9600 }
  }
}

export function savePoleConfig(port, baud = 9600) {
  const next = { port: String(port || '').trim(), baud: Number(baud || 9600) }
  fs.writeFileSync(poleConfigPath(), JSON.stringify(next, null, 2), 'utf8')
  return next
}

function execPs(command) {
  return execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    windowsHide: true,
    timeout: 8000,
  })
}

export async function listComPorts() {
  if (process.platform !== 'win32') return []
  try {
    const { stdout } = await execPs('[System.IO.Ports.SerialPort]::GetPortNames() | ForEach-Object { $_ }')
    return String(stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^COM\d+$/i.test(s))
  } catch {
    return []
  }
}

function pad20(text) {
  const clean = String(text || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .slice(0, 20)
  return clean + ' '.repeat(Math.max(0, 20 - clean.length))
}

export async function writePoleLines(line1, line2) {
  const cfg = loadPoleConfig()
  if (!cfg.port) return { success: false, error: 'No COM port configured' }

  const l1 = pad20(line1)
  const l2 = pad20(line2)
  const bytes = [
    0x1b, 0x40, 0x0c,
    ...Buffer.from(l1, 'ascii'),
    0x0d, 0x0a,
    ...Buffer.from(l2, 'ascii'),
  ]
  const hex = bytes.map((b) => `0x${b.toString(16).padStart(2, '0')}`).join(',')
  const portLit = cfg.port.replace(/'/g, "''")
  const baud = cfg.baud || 9600

  try {
    await execPs(`
$port = New-Object System.IO.Ports.SerialPort '${portLit}',${baud},'None',8,'One'
$port.Handshake = 'None'
$port.ReadTimeout = 500
$port.WriteTimeout = 1500
$port.Open()
try {
  $bytes = [byte[]](${hex})
  $port.Write($bytes, 0, $bytes.Length)
} finally {
  $port.Close()
  $port.Dispose()
}
`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  }
}

export async function writePoleFromCart(payload) {
  const lines = Array.isArray(payload?.lines) ? payload.lines : []
  const total = Number(payload?.total ?? 0)
  if (payload?.thankYou) {
    return writePoleLines('THANK YOU', `BAL ${Number(payload.change ?? 0).toFixed(2)}`)
  }
  if (lines.length === 0) {
    return writePoleLines('WELCOME', 'DON & SONS')
  }
  const last = lines[lines.length - 1]
  const name = String(last?.name || 'ITEM')
  return writePoleLines(name, `TOTAL ${total.toFixed(2)}`)
}
