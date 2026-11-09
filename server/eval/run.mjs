// Retrieval eval: hit@4 of the expected chunk. Exits non-zero below the threshold.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Bm25Retriever, loadKb } from '../src/bm25.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const chunks = loadKb(join(here, '..', 'kb'))
const retriever = new Bm25Retriever(chunks)
const questions = JSON.parse(readFileSync(join(here, 'questions.json'), 'utf8'))
const THRESHOLD = 0.9
const K = 4

let hit = 0
let top1 = 0
for (const { q, expect } of questions) {
  const ids = retriever.search(q, K).map((r) => r.chunk.id)
  const ok = ids.includes(expect)
  if (ok) hit++
  if (ids[0] === expect) top1++
  if (!ok) console.log(`MISS  "${q}"\n      expected ${expect}\n      got      ${ids.join(', ') || '(nothing)'}`)
}
const rate = hit / questions.length
console.log(`hit@${K}: ${hit}/${questions.length} (${(rate * 100).toFixed(0)}%)   top1: ${top1}/${questions.length}`)
process.exit(rate >= THRESHOLD ? 0 : 1)
