// ============================================================
// adminAuth.js — Admin authentication & security
//
// Security layers:
//  1. Hardcoded admin credentials (change ADMIN_EMAIL + ADMIN_PASSWORD)
//  2. Rate limiting — locks out after 5 failed attempts for 15 min
//  3. Session token with expiry (8 hours)
//  4. All sensitive keys are hashed before storage
// ============================================================

// ── CHANGE THESE BEFORE GOING LIVE ─────────────────────────
export const ADMIN_EMAIL    = 'admin@boringthings.com'   // your email
const ADMIN_PASSWORD_HASH   = hashSimple('BoringAdmin2025!')  // change the password string

// ── Session config ──────────────────────────────────────────
const SESSION_TTL_MS   = 8 * 60 * 60 * 1000   // 8 hours
const MAX_ATTEMPTS     = 5
const LOCKOUT_MS       = 15 * 60 * 1000        // 15 minutes
const SESSION_KEY      = 'bt_admin_session'
const ATTEMPTS_KEY     = 'bt_admin_attempts'

// ── Simple deterministic hash (not cryptographic, just obfuscation) ──
function hashSimple(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString(36)
}

// ── Generate a random session token ──────────────────────────
function generateToken() {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
}

// ── Check if credentials match ───────────────────────────────
export function validateAdminCredentials(email, password) {
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
    && hashSimple(password) === ADMIN_PASSWORD_HASH
}

// ── Rate limiting ────────────────────────────────────────────
export function getAttemptStatus() {
  try {
    const data = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}')
    const now = Date.now()
    if (data.lockedUntil && now < data.lockedUntil) {
      const mins = Math.ceil((data.lockedUntil - now) / 60000)
      return { locked: true, remainingMins: mins }
    }
    return { locked: false, attempts: data.attempts || 0 }
  } catch { return { locked: false, attempts: 0 } }
}

export function recordFailedAttempt() {
  try {
    const data = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}')
    const attempts = (data.attempts || 0) + 1
    const payload = attempts >= MAX_ATTEMPTS
      ? { attempts, lockedUntil: Date.now() + LOCKOUT_MS }
      : { attempts }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(payload))
    return attempts
  } catch { return 1 }
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY)
}

// ── Session management ───────────────────────────────────────
export function createSession() {
  const session = { token: generateToken(), expiry: Date.now() + SESSION_TTL_MS }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!session) return null
    if (Date.now() > session.expiry) { destroySession(); return null }
    return session
  } catch { return null }
}

export function destroySession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isAdminLoggedIn() {
  return !!getSession()
}

// ── Activity log ─────────────────────────────────────────────
const LOG_KEY = 'bt_admin_log'
export function logAdminAction(action, detail = '') {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
    log.unshift({
      ts:     new Date().toLocaleString(),
      action,
      detail,
    })
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 200))) // keep last 200
  } catch {}
}

export function getAdminLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') } catch { return [] }
}
