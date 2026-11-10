import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bm25Retriever, loadKb, parseKbFile, buildContext, tokenize } from '../src/bm25.mjs'
import { buildSystem, HANDOFF_TOOL } from '../src/prompt.mjs'
import { offlineChat, planOffline } from '../src/offline.mjs'
import { validateEscalation, sendEscalation, emailConfigured } from '../src/escalate.mjs'

const kbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'kb')
const chunks = loadKb(kbDir)
const retriever = new Bm25Retriever(chunks)

test('kb parses into chunks with ids, types and keywords', () => {
  assert.ok(chunks.length >= 10)
  assert.equal(new Set(chunks.map((c) => c.id)).size, chunks.length, 'chunk ids are unique')
  assert.equal(chunks.filter((c) => c.type === 'pinned').length, 1)
  assert.equal(chunks.filter((c) => c.type === 'gaps').length, 1)
  assert.ok(chunks.every((c) => c.heading && c.text))
})

test('parseKbFile handles CRLF, BOM and keywords', () => {
  const raw = '﻿---\r\ntype: normal\r\n---\r\n\r\n## Hello World\r\nkeywords: a, b\r\n\r\nBody text.\r\n'
  const [c] = parseKbFile('t', raw)
  assert.equal(c.id, 't#hello-world')
  assert.equal(c.keywords, 'a, b')
  assert.equal(c.text, 'Body text.')
})

test('tokenizer stems and drops stopwords', () => {
  assert.deepEqual(tokenize('How do I apply the gel?'), ['apply', 'gel'])
  assert.deepEqual(tokenize('applying'), ['apply'])
})

test('retrieves the right chunk for a clear question', () => {
  const top = retriever.search('what is your return policy', 4)[0]
  assert.equal(top.chunk.id, 'policies#returns-and-refunds')
})

test('pinned and gaps chunks are never returned by search but always in context', () => {
  const ids = retriever.search('burning rash reaction doctor', 10).map((r) => r.chunk.id)
  assert.ok(!ids.some((i) => i.startsWith('safety#') || i.startsWith('known-gaps#')))
  const ctx = buildContext(retriever, chunks, 'zzzz unrelated')
  assert.ok(ctx.chunks.some((c) => c.type === 'pinned'))
  assert.ok(ctx.chunks.some((c) => c.type === 'gaps'))
})

test('system prompt carries the rules, the context and a handoff tool', () => {
  const s = buildSystem(chunks.slice(0, 2))
  assert.match(s, /never compare/i)
  assert.match(s, /offer_human_handoff/)
  assert.ok(s.includes(chunks[0].text))
  assert.equal(HANDOFF_TOOL.name, 'offer_human_handoff')
})

test('validateEscalation rejects bad input and cleans good input', () => {
  assert.equal(validateEscalation({}).ok, false)
  assert.equal(validateEscalation({ name: 'A', email: 'nope', message: 'hello there' }).errors.email.length > 0, true)
  const ok = validateEscalation({ name: 'Priya\r\nBcc: x@y.com', email: 'p@example.com', message: 'My eyes burn', consent: true, transcript: [{ role: 'user', content: 'hi' }] })
  assert.equal(ok.ok, true)
  assert.ok(!/[\r\n]/.test(ok.value.name))
})

test('sendEscalation sets reply-to to the customer and logs first', async () => {
  const sent = []
  const env = { SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'bot@site.com', ESCALATION_TO: 'team@site.com' }
  assert.equal(emailConfigured(env), true)
  const v = validateEscalation({ name: 'Priya', email: 'priya@example.com', message: 'My eyes burn', category: 'reaction', consent: true }).value
  const r = await sendEscalation(v, { env, transport: { sendMail: async (m) => sent.push(m) } })
  assert.equal(r.emailed, true)
  assert.equal(sent[0].replyTo.address, 'priya@example.com')
  assert.equal(sent[0].to, 'team@site.com')
})

test('sendEscalation reports not-emailed when SMTP is missing', async () => {
  const v = validateEscalation({ name: 'A', email: 'a@b.co', message: 'hello there', consent: true }).value
  const r = await sendEscalation(v, { env: {}, transport: { sendMail: async () => assert.fail('must not send') } })
  assert.equal(r.emailed, false)
})

test('kb contains no claim words the prompt forbids', () => {
  const all = chunks.filter((c) => c.type === 'normal').map((c) => c.text).join(' ')
  assert.doesNotMatch(all, /\b(cures?|guaranteed?|heals?)\b/i)
  assert.ok(readFileSync(join(kbDir, 'known-gaps.md'), 'utf8').length > 0)
})

test('escalation requires consent', () => {
  const r = validateEscalation({ name: 'A', email: 'a@b.co', message: 'hello there' })
  assert.equal(r.ok, false)
  assert.ok(r.errors.consent)
})

test('system prompt names Minerva', () => {
  assert.match(buildSystem(chunks.slice(0, 1)), /You are Minerva/)
})

test('offline: answers from kb, hands off on reaction, declines comparisons, admits gaps', () => {
  const p = (q) => planOffline(q, retriever)
  assert.match(p('How do I use it?').text, /pea-sized/i)
  assert.match(p('What is your return policy?').text, /7 days/)
  const r = p('my eyes are burning')
  assert.equal(r.handoff?.category, 'reaction')
  assert.match(r.text, /stop using/i)
  assert.equal(p('Is it safe during pregnancy?').handoff?.category, 'medical')
  assert.match(p('is it better than Garnier?').text, /not able to compare/i)
  assert.equal(p('what is the shelf life of the moon rock').handoff?.category, 'unanswered')
  assert.equal(p('I want to talk to a human').handoff?.category, 'requested_human')
  assert.match(p('hello').text, /Minerva/)
})

test('offline: never uses forbidden claim words', () => {
  const qs = ['what does it do', 'results', 'ingredients', 'price', 'shipping', 'returns', 'hello', 'where to buy']
  for (const q of qs) assert.doesNotMatch(planOffline(q, retriever).text, /\b(cures?|guaranteed?|heals?|treats?)\b/i)
})

test('offlineChat streams text events then a handoff tool event', async () => {
  const evs = []
  for await (const e of offlineChat({ messages: [{ role: 'user', content: 'my skin has a rash' }], retriever })) evs.push(e)
  assert.ok(evs.filter((e) => e.type === 'text').length > 3)
  assert.equal(evs.at(-1).type, 'tool')
  assert.equal(evs.at(-1).name, 'offer_human_handoff')
})

test('offline: chip questions answer correctly', () => {
  const p = (q) => planOffline(q, retriever).text
  assert.match(p("What's in it?"), /Kojic Acid/)
  assert.match(p('Delivery & returns'), /7 days/)
  assert.match(p('Delivery & returns'), /dispatched within 2 to 3 business days/) // second chunk named in the question
  assert.doesNotMatch(p('How do I use it?'), /dermatologically tested/) // unrelated neighbour is not appended
  assert.match(p('Where to buy'), /Amazon/)
})
