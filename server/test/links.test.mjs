// Data check for links in reply text: links must be [label](target) markup, labels must be human
// readable, and every internal target must match a route in src/App.tsx.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadIntents } from '../src/dialog.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const data = loadIntents()
const replies = [
  ...Object.entries(data.intents).flatMap(([id, i]) => (i.replies ?? []).map((text) => ({ id, text }))),
  ...Object.entries(data.slots).flatMap(([id, s]) => [s.prompt, s.invalid].map((text) => ({ id, text }))),
]

const MARKUP = /\[([^\]\n]+)\]\(([^)\s]+)\)/g
const routes = [...readFileSync(join(root, 'src', 'App.tsx'), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p !== '*')
const slugs = [...readFileSync(join(root, 'src', 'data', 'products.ts'), 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
const routeRe = (p) => new RegExp(`^${p.replace(/:[^/]+/g, '[^/]+')}/?$`)

test('App.tsx routes were found', () => {
  assert.ok(routes.includes('/shop') && routes.includes('/contact') && routes.includes('/about'))
})

test('reply text has no bare paths, bare URLs or malformed link markup', () => {
  for (const { id, text } of replies) {
    const rest = text.replace(MARKUP, 'LINK')
    assert.doesNotMatch(rest, /(^|[\s(:])\/[A-Za-z]/, `${id}: bare path in "${text.slice(0, 80)}"`)
    assert.doesNotMatch(rest, /https?:\/\//i, `${id}: bare URL`)
    assert.doesNotMatch(rest, /\[|\]\(|\]\s+\(/, `${id}: malformed [label](target) markup`)
  }
})

test('every link has a readable label and an allowed, real target', () => {
  let count = 0
  for (const { id, text } of replies) {
    for (const [, label, target] of text.matchAll(MARKUP)) {
      count++
      assert.doesNotMatch(label, /^\/|https?:|www\./i, `${id}: label "${label}" looks like a URL`)
      assert.match(target, /^(\/(?!\/)|https:\/\/|mailto:|tel:)/, `${id}: target "${target}" is not allowed`)
      if (target.startsWith('/')) {
        const path = target.split(/[?#]/)[0]
        assert.ok(routes.some((r) => routeRe(r).test(path)), `${id}: ${target} matches no route in App.tsx`)
        const slug = path.match(/^\/product\/([^/]+)/)?.[1]
        if (slug) assert.ok(slugs.includes(slug), `${id}: product slug ${slug} not in products.ts`)
      }
    }
  }
  assert.ok(count > 0)
})

test('bullet replies: lead-in line, at least two "• " bullets, no empty bullets, no "- " lines', () => {
  let bulleted = 0
  for (const { id, text } of replies) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const l of lines) {
      assert.ok(!l.startsWith('- '), `${id}: line starts with "- "`)
      assert.ok(l !== '\u2022', `${id}: empty bullet`)
      if (l.startsWith('\u2022')) assert.ok(/^\u2022 \S/.test(l), `${id}: bullet needs "• " then text`)
    }
    const bullets = lines.filter((l) => l.startsWith('\u2022 '))
    if (!bullets.length) continue
    bulleted++
    assert.ok(!lines[0].startsWith('\u2022'), `${id}: bullets need a lead-in line`)
    assert.ok(bullets.length >= 2, `${id}: a list needs at least two bullets`)
  }
  assert.ok(bulleted >= 10)
})
