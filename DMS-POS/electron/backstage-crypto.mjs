import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { app, safeStorage } from 'electron'

export const ENCRYPTED_CONFIG_NAME = 'pos-config.dat'
export const LEGACY_CONFIG_NAME = 'pos-config.json'

const MAGIC = Buffer.from('DMS1')
const VERSION = 1
const MODE_SAFE = 1
const MODE_AES = 2

const PBKDF2_ITER = 210_000
const ADMIN_SALT = Buffer.from('e3b77c5da90c5861ded5b9369942f0cb', 'hex')
const ADMIN_HASH = Buffer.from('095eb86278c619a32708a932975865e36b36572765ed1608f3e70d2999549883', 'hex')

/** Split pepper — not a usable password; only AES fallback material. */
const PEPPER_A = Buffer.from([0x4b, 0x91, 0x2e, 0x7c, 0xd4, 0x18, 0xa3, 0x5f])
const PEPPER_B = Buffer.from([0xe6, 0x0b, 0x77, 0x33, 0xc8, 0x9a, 0x14, 0xfd])
const PEPPER_C = Buffer.from([0x52, 0x6d, 0x01, 0xb8, 0xce, 0x47, 0x90, 0x2a])

const UNLOCK_MS = 5 * 60_000
const LOCKOUT_MS = 30_000
const MAX_FAILURES = 5

let failures = 0
let lockUntil = 0
let unlockedUntil = 0

export function verifyAdminKey(password) {
  if (Date.now() < lockUntil) {
    const wait = Math.ceil((lockUntil - Date.now()) / 1000)
    return { ok: false, locked: true, message: `Too many attempts. Wait ${wait}s.` }
  }

  const pwd = typeof password === 'string' ? password : ''
  const digest = crypto.pbkdf2Sync(pwd, ADMIN_SALT, PBKDF2_ITER, 32, 'sha512')
  const ok = digest.length === ADMIN_HASH.length && crypto.timingSafeEqual(digest, ADMIN_HASH)
  if (!ok) {
    failures += 1
    if (failures >= MAX_FAILURES) {
      lockUntil = Date.now() + LOCKOUT_MS
      failures = 0
      return { ok: false, locked: true, message: 'Too many attempts. Wait 30s.' }
    }
    return { ok: false, locked: false, message: 'Invalid verification key.' }
  }

  failures = 0
  unlockedUntil = Date.now() + UNLOCK_MS
  return { ok: true }
}

export function isBackstageUnlocked() {
  return Date.now() < unlockedUntil
}

export function lockBackstage() {
  unlockedUntil = 0
}

export function touchUnlock() {
  if (isBackstageUnlocked()) unlockedUntil = Date.now() + UNLOCK_MS
}

function pepper() {
  return Buffer.concat([PEPPER_A, PEPPER_B, PEPPER_C])
}

function machineEntropy() {
  let user = 'pos'
  try {
    user = os.userInfo().username || user
  } catch {
    /* ignore */
  }
  return crypto
    .createHash('sha256')
    .update(`${app.getPath('userData')}|${os.hostname()}|${user}|don-sons-pos`)
    .digest()
}

function deriveAesKey(salt) {
  return crypto.pbkdf2Sync(Buffer.concat([pepper(), machineEntropy()]), salt, 180_000, 32, 'sha512')
}

function normalizeConfig(raw) {
  const apiBaseUrl = typeof raw?.apiBaseUrl === 'string' ? raw.apiBaseUrl.trim() : ''
  const showroomCode = typeof raw?.showroomCode === 'string' ? raw.showroomCode.trim() : ''
  return { apiBaseUrl, showroomCode }
}

function encryptPayload(plainObj) {
  const json = JSON.stringify(normalizeConfig(plainObj))

  if (safeStorage.isEncryptionAvailable()) {
    const wrapped = safeStorage.encryptString(json)
    return Buffer.concat([MAGIC, Buffer.from([VERSION, MODE_SAFE]), wrapped])
  }

  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = deriveAesKey(salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([MAGIC, Buffer.from([VERSION, MODE_AES]), salt, iv, tag, ciphertext])
}

function decryptPayload(buf) {
  if (!buf || buf.length < 6 || !buf.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Not an encrypted POS config')
  }
  const version = buf[4]
  const mode = buf[5]
  if (version !== VERSION) throw new Error('Unsupported config version')

  if (mode === MODE_SAFE) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS encryption is not available on this machine')
    }
    const json = safeStorage.decryptString(buf.subarray(6))
    return normalizeConfig(JSON.parse(json))
  }

  if (mode === MODE_AES) {
    const salt = buf.subarray(6, 22)
    const iv = buf.subarray(22, 34)
    const tag = buf.subarray(34, 50)
    const ciphertext = buf.subarray(50)
    const key = deriveAesKey(salt)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const json = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    return normalizeConfig(JSON.parse(json))
  }

  throw new Error('Unknown config cipher mode')
}

function readLegacyJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  if (!json || typeof json !== 'object') return null
  return normalizeConfig(json)
}

export function configCandidates() {
  const list = []
  const userData = app.getPath('userData')
  list.push(path.join(userData, ENCRYPTED_CONFIG_NAME))
  if (app.isPackaged) {
    list.push(path.join(path.dirname(process.execPath), ENCRYPTED_CONFIG_NAME))
  }
  list.push(path.join(userData, LEGACY_CONFIG_NAME))
  if (app.isPackaged) {
    list.push(path.join(path.dirname(process.execPath), LEGACY_CONFIG_NAME))
  }
  return list
}

export function writePath() {
  return path.join(app.getPath('userData'), ENCRYPTED_CONFIG_NAME)
}

export function loadTillConfig() {
  for (const configPath of configCandidates()) {
    try {
      if (!fs.existsSync(configPath)) continue
      const buf = fs.readFileSync(configPath)
      if (configPath.endsWith('.dat') || (buf.length >= 4 && buf.subarray(0, 4).equals(MAGIC))) {
        const cfg = decryptPayload(buf)
        return { ...cfg, configPath, encrypted: true }
      }
      const cfg = readLegacyJson(configPath)
      if (cfg) return { ...cfg, configPath, encrypted: false, legacy: true }
    } catch (err) {
      console.error('[pos-config] Failed to read', configPath, err)
    }
  }
  return null
}

export function saveTillConfig(input) {
  if (!isBackstageUnlocked()) {
    throw new Error('Backstage session is locked')
  }
  const cfg = normalizeConfig(input)
  const dest = writePath()
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const blob = encryptPayload(cfg)
  fs.writeFileSync(dest, blob)
  touchUnlock()
  return { ...cfg, configPath: dest, encrypted: true }
}

export function migrateLegacyIfNeeded() {
  const loaded = loadTillConfig()
  if (loaded?.legacy && loaded.configPath) {
    try {
      const dest = writePath()
      const blob = encryptPayload(loaded)
      fs.writeFileSync(dest, blob)
      if (loaded.configPath.toLowerCase().endsWith('.json')) {
        try {
          fs.renameSync(loaded.configPath, `${loaded.configPath}.migrated`)
        } catch {
          /* keep legacy file if rename is blocked */
        }
      }
      console.log('[pos-config] Migrated plaintext config to encrypted file', dest)
      return { ...normalizeConfig(loaded), configPath: dest, encrypted: true }
    } catch (err) {
      console.error('[pos-config] Legacy migration failed', err)
    }
  }
  return loaded
}
