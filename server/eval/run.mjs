// Intent-routing eval: each question must resolve to its expected intent from a fresh state.
// Exits non-zero below 95% accuracy.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createDialog } from '../src/dialog.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const questions = JSON.parse(readFileSync(join(here, 'questions.json'), 'utf8'))
const dialog = createDialog()
const THRESHOLD = 0.95

let ok = 0
for (const { q, expectIntent } of questions) {
  const got = dialog.respond({ text: q }).state.intent
  if (got === expectIntent) ok++
  else console.log(`MISS  "${q}"\n      expected ${expectIntent}\n      got      ${got}`)
}
const rate = ok / questions.length
console.log(`intent accuracy: ${ok}/${questions.length} (${(rate * 100).toFixed(1)}%)`)
process.exit(rate >= THRESHOLD ? 0 : 1)
