import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

const parseSse = (text) =>
  text
    .split('\n\n')
    .map((b) => b.split('\n').find((l) => l.startsWith('data:')))
    .filter(Boolean)
    .map((l) => JSON.parse(l.slice(5)))

// Simulate Vercel: each api/*.mjs file's default export is called with (req, res);
// Vercel may pre-parse req.body.
async function startFakeVercel(preParse) {
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.SMTP_HOST
  const routes = {
    '/api/chat': (await import('../../api/chat.mjs')).default,
    '/api/escalate': (await import('../../api/escalate.mjs')).default,
    '/api/health': (await import('../../api/health.mjs')).default,
  }
  const server = http.createServer(async (req, res) => {
    if (preParse && req.method === 'POST') {
      const parts = []
      for await (const c of req) parts.push(c)
      const raw = Buffer.concat(parts).toString('utf8')
      try {
        req.body = JSON.parse(raw)
      } catch {
        req.body = raw
      }
    }
    const fn = routes[req.url.split('?')[0]]
    if (!fn) return res.writeHead(404).end()
    await fn(req, res)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return { server, url: `http://127.0.0.1:${server.address().port}`, host: `127.0.0.1:${server.address().port}` }
}

for (const preParse of [false, true]) {
  test(`vercel functions: health, offline chat, bad json, same-origin, escalate (preParsedBody=${preParse})`, async () => {
    const { server, url, host } = await startFakeVercel(preParse)
    const json = { 'content-type': 'application/json' }
    try {
      const h = await (await fetch(`${url}/api/health`)).json()
      assert.equal(h.ok, true)
      assert.equal(h.mode, 'offline')

      // The browser sends Origin on same-origin POSTs; it must be accepted.
      const r = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { ...json, origin: `http://${host}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'How do I use it?' }] }),
      })
      assert.equal(r.status, 200)
      assert.match(r.headers.get('content-type'), /text\/event-stream/)
      const events = parseSse(await r.text())
      assert.ok(events.some((e) => e.type === 'text' && e.text))
      assert.equal(events.at(-1).type, 'done')

      const other = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { ...json, origin: 'https://evil.example' },
        body: '{}',
      })
      assert.equal(other.status, 403)

      const bad = await fetch(`${url}/api/chat`, { method: 'POST', headers: json, body: '{nope' })
      assert.equal(bad.status, 400)

      const esc = await fetch(`${url}/api/escalate`, { method: 'POST', headers: json, body: JSON.stringify({}) })
      assert.equal(esc.status, 422)
    } finally {
      server.close()
    }
  })
}
