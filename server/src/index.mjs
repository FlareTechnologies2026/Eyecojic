import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Bm25Retriever, loadKb, buildContext } from './bm25.mjs'
import { HANDOFF_TOOL, buildSystem } from './prompt.mjs'
import { streamChat } from './anthropic.mjs'
import { emailConfigured, sendEscalation, validateEscalation } from './escalate.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'))

const env = process.env
const PORT = Number(env.PORT || 8787)
const MODEL = env.CLAUDE_MODEL || 'claude-haiku-5-5'
const TRUST_PROXY = env.TRUST_PROXY === '1'
const ALLOWED = (env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const LOG_FILE = join(ROOT, 'data', 'escalations.jsonl')

const chunks = loadKb(join(ROOT, 'kb'))
const retriever = new Bm25Retriever(chunks)

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
  if (origin && ALLOWED.includes(origin)) {
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

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null
  const msgs = raw
    .slice(-12)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }))
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null
  return msgs
}

// --- routes --------------------------------------------------------------
async function chat(req, res) {
  const ip = clientIp(req)
  if (rateLimited(ip, 'chat', 20, 60_000)) return json(res, 429, { error: 'Too many messages. Please wait a minute.' })
  if (!env.ANTHROPIC_API_KEY) return json(res, 503, { error: 'Chat is not configured.' })

  let body
  try {
    body = await readJson(req)
  } catch (e) {
    return json(res, e.status || 400, { error: 'Invalid request.' })
  }
  const messages = cleanMessages(body.messages)
  if (!messages) return json(res, 400, { error: 'Invalid messages.' })

  // Retrieve on the last two user turns so short follow-ups ("and the price?") keep context.
  const query = messages.filter((m) => m.role === 'user').slice(-2).map((m) => m.content).join(' ')
  const ctx = buildContext(retriever, chunks, query)

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  })
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)
  const ac = new AbortController()
  res.on('close', () => ac.abort())

  try {
    for await (const ev of streamChat({
      apiKey: env.ANTHROPIC_API_KEY,
      model: MODEL,
      system: buildSystem(ctx.chunks),
      messages,
      tools: [HANDOFF_TOOL],
      signal: ac.signal,
    })) {
      if (ev.type === 'text') send({ type: 'text', text: ev.text })
      else if (ev.type === 'tool' && ev.name === HANDOFF_TOOL.name)
        send({ type: 'handoff', reason: String(ev.input.reason ?? ''), category: String(ev.input.category ?? 'other') })
    }
    send({ type: 'done' })
  } catch (e) {
    if (!ac.signal.aborted) {
      console.error('chat error:', e.message)
      send({ type: 'error', message: 'Sorry, something went wrong. Please try again.' })
    }
  }
  res.end()
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

const server = createServer(async (req, res) => {
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
        chunks: chunks.length,
        anthropicConfigured: Boolean(env.ANTHROPIC_API_KEY),
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
})

server.listen(PORT, () => console.log(`chat server on :${PORT} (${chunks.length} kb chunks, model ${MODEL})`))
