'use strict'

const fs = require('fs')
const path = require('path')

/**
 * electron-builder skips rcedit when signing is disabled, so the packaged
 * .exe keeps the Electron atom. Stamp the Don & Sons ICO onto the exe.
 */
exports.default = async function stampWinIcon(context) {
  if (context.electronPlatformName !== 'win32') return

  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const icon = path.join(context.packager.projectDir, 'public', 'icon.ico')
  if (!fs.existsSync(exe) || !fs.existsSync(icon)) {
    console.warn('[stamp-win-icon] skipped — missing exe or icon')
    return
  }

  let rcedit
  try {
    rcedit = require('@electron/rcedit')
  } catch {
    rcedit = require('rcedit')
  }

  await rcedit(exe, { icon })
  console.log('[stamp-win-icon] applied client icon to', path.basename(exe))
}
