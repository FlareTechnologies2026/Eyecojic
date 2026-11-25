// Pure-function tests for the client reply parser (src/lib/chatFormat.ts, loaded with type stripping).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBlocks, parseInline, parseLinks } from '../../src/lib/chatFormat.ts'

test('paragraphs and a bullet group', () => {
  const blocks = parseBlocks('Here is how:\n\u2022 one\n\u2022 two\nAfter.')
  assert.deepEqual(blocks, [
    { type: 'paragraph', text: 'Here is how:' },
    { type: 'list', items: ['one', 'two'] },
    { type: 'paragraph', text: 'After.' },
  ])
})

test('a leading hyphen or a range is never a bullet; empty bullets are dropped', () => {
  assert.deepEqual(parseBlocks('- not a bullet\nDelivery takes 5 - 7 days\n\u2022 \n'), [
    { type: 'paragraph', text: '- not a bullet' },
    { type: 'paragraph', text: 'Delivery takes 5 - 7 days' },
  ])
})

test('bold label and a link inside a bullet', () => {
  const [list] = parseBlocks('\u2022 **Online:** our [contact page](/contact)')
  const toks = parseInline(list.items[0])
  assert.deepEqual(toks[0], { type: 'text', text: 'Online:', bold: true })
  assert.deepEqual(toks.at(-1), { type: 'link', label: 'contact page', href: '/contact', kind: 'internal' })
})

test('emails, phones and https URLs auto-link; unsafe targets stay text', () => {
  const kinds = parseLinks('Mail info@eyecojic.com, call +91-7840061316, see https://www.eyecojic.com/about/.')
    .filter((t) => t.type === 'link')
    .map((t) => `${t.kind}:${t.label}`)
  assert.deepEqual(kinds, ['mailto:info@eyecojic.com', 'tel:+91-7840061316', 'external:eyecojic.com'])
  assert.ok(parseLinks('[x](javascript:alert)').every((t) => t.type === 'text'))
  assert.ok(parseLinks('[x](//evil.com)').every((t) => t.type === 'text'))
})
