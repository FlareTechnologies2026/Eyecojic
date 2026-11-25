import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createDialog } from './dialog.mjs'
import { emailConfigured, sendEscalation, validateEscalation } from './escalate.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'))

const env = process.env
const PORT = Number(env.PORT || 8787)
const ON_VERCEL = Boolean(env.VERCEL)
const TRUST_PROXY = env.TRUST_PROXY === '1' || ON_VERCEL
const ALLOWED = (env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// Vercel functions can only write to /tmp.
const LOG_FILE = ON_VERCEL ? '/tmp/eyecojic/escalations.jsonl' : join(ROOT, 'data', 'escalations.jsonl')

const dialog = createDialog()

// --- helpers -------------------------------------------------------------
const hits = new Map() // ip -> number[] timestamps
function rateLimited(ip, key, max, windowMs) {
  const k = `${key}:${ip}`
  const now = Date.now()
  const list = (hits.get(k) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(k, list)
  return list.length > max
}
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of hits) if (!v.some((t) => now - t < 3_600_000)) hits.delete(k)
}, 600_000).unref()

function clientIp(req) {
  if (TRUST_PROXY) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    if (xff) return xff
  }
  return req.socket.remoteAddress || 'unknown'
}

function cors(req, res) {
  const origin = req.headers.origin
  // Same-origin calls (site and API on one host, as on Vercel) are always fine.
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
  let sameOrigin = false
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host)
  } catch {}
  if (origin && (sameOrigin || ALLOWED.includes(origin))) {
    res.setHeader('access-control-allow-origin', origin)
    res.setHeader('vary', 'origin')
    res.setHeader('access-control-allow-headers', 'content-type')
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
    return true
  }
  return !origin // non-browser callers (curl, smoke script) carry no Origin
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readJson(req, limit = 32_768) {
  // Vercel (and some proxies) may have parsed the body already.
  if (req.body !== undefined && req.body !== null) {
    const b = req.body
    const tooBig = () => Object.assign(new Error('too large'), { status: 413 })
    if (Buffer.isBuffer(b) || typeof b === 'string') {
      const text = Buffer.isBuffer(b) ? b.toString('utf8') : b
      if (Buffer.byteLength(text) > limit) throw tooBig()
      try {
        return JSON.parse(text || '{}')
      } catch {
        throw Object.assign(new Error('bad json'), { status: 400 })
      }
    }
    if (typeof b === 'object') {
      if (Buffer.byteLength(JSON.stringify(b)) > limit) throw tooBig()
      return b
    }
  }
  let size = 0
  const parts = []
  for await (const c of req) {
    size += c.length
    if (size > limit) throw Object.assign(new Error('too large'), { status: 413 })
    parts.push(c)
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8'))
  } catch {
    throw Object.assign(new Error('bad json'), { status: 400 })
  }
}

// --- routes --------------------------------------------------------------
// One turn: { text?, button?, state? } in, { messages, buttons, handoff?, state } out. No model, no streaming.
async function chat(req, res) {
  const ip = clientIp(req)
  if (rateLimited(ip, 'chat', 20, 60_000)) return json(res, 429, { error: 'Too many messages. Please wait a minute.' })

  let body
  try {
    body = await readJson(req)
  } catch (e) {
    return json(res, e.status || 400, { error: 'Invalid request.' })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Invalid request.' })
  const text = typeof body.text === 'string' ? body.text : ''
  const button = typeof body.button === 'string' ? body.button : ''
  if (!text.trim() && !button) return json(res, 400, { error: 'Send text or a button.' })
  return json(res, 200, dialog.respond({ text, button, state: body.state }))
}

async function escalate(req, res) {
  const ip = clientIp(req)
  if (rateLimited(ip, 'esc', 5, 3_600_000)) return json(res, 429, { error: 'Too many requests. Please email us directly.' })
  let body
  try {
    body = await readJson(req, 65_536)
  } catch (e) {
    return json(res, e.status || 400, { error: 'Invalid request.' })
  }
  // Honeypot: a hidden field real users never fill. Pretend success so bots learn nothing.
  if (typeof body?.website === 'string' && body.website.trim()) return json(res, 200, { ok: true })
  const v = validateEscalation(body)
  if (!v.ok) return json(res, 422, { errors: v.errors })
  try {
    const r = await sendEscalation(v.value, { env, logFile: LOG_FILE })
    // Do not tell the customer it was sent when email is not set up.
    if (!r.emailed) return json(res, 503, { error: 'Email is not available right now. Please write to us directly.' })
    return json(res, 200, { ok: true })
  } catch (e) {
    console.error('escalation email failed:', e.message)
    return json(res, 502, { error: 'We could not send your message. Please email us directly.' })
  }
}

// Request handler: used by the standalone server below and by the Vercel functions in api/.
export async function handler(req, res) {
  const allowed = cors(req, res)
  if (req.method === 'OPTIONS') {
    res.writeHead(allowed ? 204 : 403)
    return res.end()
  }
  if (!allowed) return json(res, 403, { error: 'Origin not allowed.' })
  const path = (req.url || '').split('?')[0]
  try {
    if (req.method === 'GET' && path === '/api/health')
      return json(res, 200, {
        ok: true,
        intents: dialog.intentCount,
        mode: 'intent',
        emailConfigured: emailConfigured(env),
      })
    if (req.method === 'POST' && path === '/api/chat') return await chat(req, res)
    if (req.method === 'POST' && path === '/api/escalate') return await escalate(req, res)
    return json(res, 404, { error: 'Not found.' })
  } catch (e) {
    console.error(e)
    if (!res.headersSent) json(res, 500, { error: 'Server error.' })
    else res.end()
  }
}

// Start listening only when run directly (npm start), not when imported by a Vercel function.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer(handler).listen(PORT, () =>
    console.log(`chat server on :${PORT} (${dialog.intentCount} intents, intent mode)`),
  )
}
