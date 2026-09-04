import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

/** ESC/POS pulse on drawer pin 2, then pin 5 (covers most till printers). */
const KICK = Buffer.from([
  0x1b, 0x70, 0x00, 0x19, 0xfa,
  0x1b, 0x70, 0x01, 0x19, 0xfa,
])

function execPs(command) {
  return execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    windowsHide: true,
    timeout: 8000,
  })
}

async function defaultPrinterName() {
  const { stdout } = await execPs(
    `(Get-CimInstance Win32_Printer -Filter "Default=true").Name`,
  )
  return String(stdout ?? '').trim()
}

/**
 * Send a raw cash-drawer kick to the Windows default printer (no dialog).
 */
export async function openCashDrawer() {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Cash drawer kick is only implemented on Windows' }
  }

  const tmp = path.join(os.tmpdir(), `dms-pos-drawer-${Date.now()}.bin`)
  try {
    fs.writeFileSync(tmp, KICK)
    const printer = await defaultPrinterName()
    if (!printer) {
      return { success: false, error: 'No default printer' }
    }

    const tmpLit = tmp.replace(/'/g, "''")
    const printerLit = printer.replace(/'/g, "''")
    await execPs(`
$bytes = [System.IO.File]::ReadAllBytes('${tmpLit}')
$path = '\\\\localhost\\${printerLit}'
$fs = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
try { $fs.Write($bytes, 0, $bytes.Length) } finally { $fs.Dispose() }
`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error?.message || String(error) }
  } finally {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
}
