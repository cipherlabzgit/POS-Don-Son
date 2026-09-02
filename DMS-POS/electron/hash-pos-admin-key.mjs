/**
 * Rotate the backstage Verification Admin Key.
 * Usage: node electron/hash-pos-admin-key.mjs "YourNewUncommonKey"
 * Paste the printed ADMIN_SALT / ADMIN_HASH into backstage-crypto.mjs
 */
import crypto from 'crypto'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node electron/hash-pos-admin-key.mjs "<new-key>"')
  process.exit(1)
}

const salt = crypto.randomBytes(16)
const hash = crypto.pbkdf2Sync(password, salt, 210_000, 32, 'sha512')
console.log(`const ADMIN_SALT = Buffer.from('${salt.toString('hex')}', 'hex')`)
console.log(`const ADMIN_HASH = Buffer.from('${hash.toString('hex')}', 'hex')`)
