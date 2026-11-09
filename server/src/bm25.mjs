// Zero-dependency BM25 retriever over the markdown knowledge base in kb/.
// One chunk per "##" section. Optional "keywords:" line right under the heading.
// Chunk types come from front matter: normal | pinned | gaps.
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in is it its me my of on or our so than that the their then there these they this to was we what when where which who will with you your tell about please kya hai hain ka ki ke ko se me mein aur ye woh'.split(
    ' ',
  ),
)

// Cheap suffix stemmer: enough to match "applying/applied/applies" -> "appl".
export function stem(w) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3)
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('es')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

export function tokenize(text) {
  return (String(text).toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((t) => !STOP.has(t))
    .map(stem)
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function parseKbFile(name, raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n')
  let type = 'normal'
  let body = text
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (fm) {
    const t = fm[1].match(/^type:\s*(\w+)/m)
    if (t) type = t[1]
    body = text.slice(fm[0].length)
  }
  const chunks = []
  for (const part of body.split(/^## /m).slice(1)) {
    const nl = part.indexOf('\n')
    const heading = part.slice(0, nl).trim()
    let rest = part.slice(nl + 1).trim()
    let keywords = ''
    const kw = rest.match(/^keywords:\s*(.*)\n?/i)
    if (kw) {
      keywords = kw[1].trim()
      rest = rest.slice(kw[0].length).trim()
    }
    chunks.push({
      id: `${name}#${slug(heading)}`,
      source: name,
      heading,
      keywords,
      text: rest,
      type,
    })
  }
  return chunks
}

export function loadKb(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .flatMap((f) => parseKbFile(basename(f, '.md'), readFileSync(join(dir, f), 'utf8')))
}

export class Bm25Retriever {
  constructor(chunks, { k1 = 1.5, b = 0.75 } = {}) {
    this.k1 = k1
    this.b = b
    this.chunks = chunks
    // Heading x3 and keywords x2 so they outweigh body text.
    this.docs = chunks.map((c) => {
      const toks = [
        ...tokenize(c.heading),
        ...tokenize(c.heading),
        ...tokenize(c.heading),
        ...tokenize(c.keywords),
        ...tokenize(c.keywords),
        ...tokenize(c.text),
      ]
      const tf = new Map()
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1)
      return { tf, len: toks.length }
    })
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / (this.docs.length || 1)
    this.df = new Map()
    for (const d of this.docs) for (const t of d.tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
  }

  // Same interface the future embedding retriever must expose.
  search(query, k = 4) {
    const q = [...new Set(tokenize(query))]
    const N = this.docs.length
    const scored = this.chunks.map((chunk, i) => {
      const { tf, len } = this.docs[i]
      let score = 0
      for (const t of q) {
        const f = tf.get(t)
        if (!f) continue
        const n = this.df.get(t)
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
        score += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * len) / this.avgLen))
      }
      return { chunk, score }
    })
    return scored
      .filter((r) => r.score > 0 && r.chunk.type === 'normal')
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }
}

// Context for one request: top-k matches plus the pinned and known-gaps chunks, always.
export function buildContext(retriever, chunks, query, k = 4) {
  const hits = retriever.search(query, k).map((r) => r.chunk)
  const always = chunks.filter((c) => c.type === 'pinned' || c.type === 'gaps')
  return { hits, chunks: [...hits, ...always] }
}
