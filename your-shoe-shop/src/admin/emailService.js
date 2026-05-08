// ============================================================
// emailService.js — Sends verification codes via EmailJS
//
// SETUP (one-time, 5 minutes):
// 1. Go to https://www.emailjs.com and create a FREE account
// 2. Add an Email Service (Gmail recommended) → copy SERVICE_ID
// 3. Create an Email Template with these variables:
//      {{to_email}}  {{to_name}}  {{code}}  {{purpose}}
//    Subject:  "BoringThings – Your {{purpose}} code: {{code}}"
//    Body:     "Hi {{to_name}}, your verification code is: {{code}}
//               This code expires in 10 minutes."
// 4. Copy your TEMPLATE_ID and PUBLIC_KEY
// 5. Replace the three placeholder values below
// ============================================================
 
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID'   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY'   // e.g. 'aBcDeFgHiJkLmNoP'
 
// Generates a random 6-digit code
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
 
// Sends a verification code email via EmailJS
// Returns { success: true } or { success: false, error: string }
export async function sendVerificationEmail(toEmail, toName, code, purpose = 'verification') {
  try {
    // Dynamically load EmailJS SDK from CDN (no npm install needed)
    if (!window.emailjs) {
      await loadEmailJS()
    }
    window.emailjs.init(EMAILJS_PUBLIC_KEY)
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: toEmail,
      to_name:  toName || toEmail.split('@')[0],
      code,
      purpose,
    })
    return { success: true }
  } catch (err) {
    console.error('EmailJS error:', err)
    return { success: false, error: err?.text || err?.message || 'Failed to send email' }
  }
}
 
function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load EmailJS'))
    document.head.appendChild(script)
  })
}
 
// ── Code store (in-memory + localStorage backup) ───────────
// Stores { code, expiry, email } so we can verify later
const CODE_KEY = 'bt_pending_codes'
 
export function storePendingCode(email, code) {
  const codes = getPendingCodes()
  codes[email] = { code, expiry: Date.now() + 10 * 60 * 1000 } // 10 min TTL
  localStorage.setItem(CODE_KEY, JSON.stringify(codes))
}
 
export function verifyCode(email, inputCode) {
  const codes = getPendingCodes()
  const entry = codes[email]
  if (!entry) return { valid: false, reason: 'No code found for this email.' }
  if (Date.now() > entry.expiry) {
    delete codes[email]
    localStorage.setItem(CODE_KEY, JSON.stringify(codes))
    return { valid: false, reason: 'Code has expired. Please request a new one.' }
  }
  if (entry.code !== inputCode.trim()) return { valid: false, reason: 'Incorrect code. Please try again.' }
  // Valid — clean up
  delete codes[email]
  localStorage.setItem(CODE_KEY, JSON.stringify(codes))
  return { valid: true }
}
 
function getPendingCodes() {
  try { return JSON.parse(localStorage.getItem(CODE_KEY) || '{}') } catch { return {} }
}
 