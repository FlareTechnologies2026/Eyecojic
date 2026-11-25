// Pure timing helpers for Minerva's thinking pause and word reveal (src/lib/reveal.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  THINK_MIN_MS, THINK_MAX_MS, WORD_GAP_MS, WORD_FADE_MS, REVEAL_CAP_MS,
  thinkDelay, remainingPause, wordGap, revealDuration, countWords, wordPieces,
} from '../../src/lib/reveal.ts'

test('thinking pause is always between 2000 and 2500 ms', () => {
  assert.equal(THINK_MIN_MS, 2000)
  assert.equal(THINK_MAX_MS, 2500)
  assert.equal(thinkDelay(() => 0), 2000)
  assert.equal(thinkDelay(() => 1), 2500)
  assert.equal(thinkDelay(() => 7), 2500, 'clamped')
  for (let i = 0; i < 500; i++) {
    const d = thinkDelay()
    assert.ok(d >= 2000 && d <= 2500, String(d))
  }
})

test('remaining pause waits out the rest, and adds nothing when the server was slow', () => {
  assert.equal(remainingPause(1000, 1300, 2200), 1900)
  assert.equal(remainingPause(1000, 4000, 2200), 0)
})

test('per-word delay is 35 ms, shortened so the reveal stays within the cap', () => {
  assert.equal(wordGap(10), WORD_GAP_MS)
  assert.equal(wordGap(1), WORD_GAP_MS)
  for (const n of [120, 200, 500, 2000]) {
    const g = wordGap(n)
    assert.ok(g < WORD_GAP_MS)
    assert.ok(revealDuration(n, g) <= REVEAL_CAP_MS + 0.001, `${n} words`)
  }
  assert.equal(revealDuration(0, 35), 0)
  assert.equal(revealDuration(3, 35), 2 * 35 + WORD_FADE_MS)
})

test('word count keeps links whole and counts bullet words, ignoring markup', () => {
  // "Here is how:" 3, "Phone:" 1 + number link 1, "our" 1 + "contact page" link 1
  assert.equal(countWords('Here is how:\n\u2022 **Phone:** +91-7840061316\n\u2022 our [contact page](/contact)'), 7)
  assert.equal(countWords('Delivery takes 5 - 7 days'), 6, 'a lone hyphen is a word, not a bullet')
  assert.deepEqual(wordPieces('a  b\nc'), ['a', '  ', 'b', '\n', 'c'])
})
