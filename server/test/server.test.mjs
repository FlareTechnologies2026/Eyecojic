import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bm25Retriever, loadKb, parseKbFile, buildContext, tokenize } from '../src/bm25.mjs'
import { buildSystem, HANDOFF_TOOL } from '../src/prompt.mjs'
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
  const ok = validateEscalation({ name: 'Priya\r\nBcc: x@y.com', email: 'p@example.com', message: 'My eyes burn', transcript: [{ role: 'user', content: 'hi' }] })
  assert.equal(ok.ok, true)
  assert.ok(!/[\r\n]/.test(ok.value.name))
})

test('sendEscalation sets reply-to to the customer and logs first', async () => {
  const sent = []
  const env = { SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'bot@site.com', ESCALATION_TO: 'team@site.com' }
  assert.equal(emailConfigured(env), true)
  const v = validateEscalation({ name: 'Priya', email: 'priya@example.com', message: 'My eyes burn', category: 'reaction' }).value
  const r = await sendEscalation(v, { env, transport: { sendMail: async (m) => sent.push(m) } })
  assert.equal(r.emailed, true)
  assert.equal(sent[0].replyTo.address, 'priya@example.com')
  assert.equal(sent[0].to, 'team@site.com')
})

test('sendEscalation reports not-emailed when SMTP is missing', async () => {
  const v = validateEscalation({ name: 'A', email: 'a@b.co', message: 'hello there' }).value
  const r = await sendEscalation(v, { env: {}, transport: { sendMail: async () => assert.fail('must not send') } })
  assert.equal(r.emailed, false)
})

test('kb contains no claim words the prompt forbids', () => {
  const all = chunks.filter((c) => c.type === 'normal').map((c) => c.text).join(' ')
  assert.doesNotMatch(all, /\b(cures?|guaranteed?|heals?)\b/i)
  assert.ok(readFileSync(join(kbDir, 'known-gaps.md'), 'utf8').length > 0)
})
