'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function findRceditExe(projectDir) {
  const names = process.arch === 'ia32' ? ['rcedit.exe', 'rcedit-x64.exe'] : ['rcedit-x64.exe', 'rcedit.exe']
  const roots = [
    path.join(projectDir, 'node_modules', '@electron', 'rcedit', 'bin'),
    path.join(projectDir, 'node_modules', 'rcedit', 'bin'),
    path.join(projectDir, 'node_modules', 'app-builder-lib', 'node_modules', '@electron', 'rcedit', 'bin'),
    path.join(projectDir, 'node_modules', 'electron-builder', 'node_modules', '@electron', 'rcedit', 'bin'),
  ]
  for (const dir of roots) {
    for (const name of names) {
      const candidate = path.join(dir, name)
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}

/**
 * Stamp the Don & Sons ICO onto the packaged exe.
 * Never throw — a missing rcedit must not abort the installer build.
 */
exports.default = async function stampWinIcon(context) {
  if (context.electronPlatformName !== 'win32') return

  const projectDir = context.packager.projectDir
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const icon = path.join(projectDir, 'public', 'icon.ico')
  if (!fs.existsSync(exe) || !fs.existsSync(icon)) {
    console.warn('[stamp-win-icon] skipped — missing exe or icon')
    return
  }

  const bin = findRceditExe(projectDir)
  if (bin) {
    const result = spawnSync(bin, [exe, '--set-icon', icon], { encoding: 'utf8' })
    if (result.status === 0) {
      console.log('[stamp-win-icon] applied client icon to', path.basename(exe))
      return
    }
    console.warn('[stamp-win-icon] rcedit.exe failed:', result.stderr || result.stdout)
  }

  for (const id of ['@electron/rcedit', 'rcedit']) {
    try {
      const rcedit = require(id)
      await rcedit(exe, { icon })
      console.log('[stamp-win-icon] applied client icon via', id)
      return
    } catch {
      /* try next */
    }
  }

  console.warn('[stamp-win-icon] rcedit not found — exe icon left as electron-builder set it')
}
