import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

// Simulate Vercel: each api/*.mjs default export is called with (req, res);
// Vercel may pre-parse req.body.
async function startFakeVercel(preParse) {
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
  const { port } = server.address()
  return { server, url: `http://127.0.0.1:${port}`, host: `127.0.0.1:${port}` }
}

const json = { 'content-type': 'application/json' }
const post = (url, body, headers = {}) =>
  fetch(url, { method: 'POST', headers: { ...json, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })

for (const preParse of [false, true]) {
  test(`api contract: health, turns, slot flow, CORS, bad input, escalate (preParsedBody=${preParse})`, async () => {
    const { server, url, host } = await startFakeVercel(preParse)
    try {
      const h = await (await fetch(`${url}/api/health`)).json()
      assert.equal(h.ok, true)
      assert.equal(h.mode, 'intent')
      assert.ok(h.intents > 10)
      assert.equal(h.emailConfigured, false)

      // Same-origin browser POST (carries Origin) is accepted; plain JSON, no SSE.
      const r = await post(`${url}/api/chat`, { text: 'How do I use it?', state: {} }, { origin: `http://${host}` })
      assert.equal(r.status, 200)
      assert.match(r.headers.get('content-type'), /application\/json/)
      const turn = await r.json()
      assert.match(turn.messages[0].text, /pea-sized/)
      assert.ok(Array.isArray(turn.buttons))
      assert.equal(turn.state.intent, 'how_to_use')

      // Button turn into the slot flow, then fill it with the state echoed back.
      const ask = await (await post(`${url}/api/chat`, { button: 'get_recommendations', state: turn.state })).json()
      assert.equal(ask.state.slot, 'skin_tone')
      const done = await (await post(`${url}/api/chat`, { text: 'fair', state: ask.state })).json()
      assert.equal(done.state.intent, 'recommendation')

      const reaction = await (await post(`${url}/api/chat`, { text: 'my eyes are itchy after using it' })).json()
      assert.equal(reaction.handoff.category, 'reaction')

      assert.equal((await post(`${url}/api/chat`, '{}', { origin: 'https://evil.example' })).status, 403)
      assert.equal((await post(`${url}/api/chat`, '{nope')).status, 400)
      assert.equal((await post(`${url}/api/chat`, { text: '   ' })).status, 400)
      assert.equal((await post(`${url}/api/escalate`, {})).status, 422)
      assert.equal((await post(`${url}/api/escalate`, { website: 'spam' })).status, 200, 'honeypot looks successful')
    } finally {
      server.close()
    }
  })
}

test('chat is rate limited to 20 requests a minute per client', async () => {
  const { server, url } = await startFakeVercel(false)
  try {
    const statuses = []
    for (let i = 0; i < 22; i++) statuses.push((await post(`${url}/api/chat`, { text: 'hi' }, { 'x-test': String(i) })).status)
    assert.ok(statuses.includes(429))
  } finally {
    server.close()
  }
})
