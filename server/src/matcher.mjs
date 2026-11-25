// Deterministic text matching for Minerva: normalising, synonyms, ordered regex rules,
// keyword-phrase scoring and slot-value matching. No model, no network.

const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in is it its me my of on or our so than that the their then there these they this to was we what when where which who will with you your tell about please kya hai hain ka ki ke ko se me mein aur ye woh s t'.split(
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

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Rewrites phrasings whose content words are all stopwords ("what's in it?").
export function expandQuery(text) {
  return String(text)
    .replace(/\bwhat(?:')?s?\s+(?:is\s+)?(?:in|inside)\s+(?:it|this|the gel|the product|eyecojic)\b/gi, 'ingredients')
    .replace(/\bwhat\s+is\s+it\s+made\s+(?:of|from)\b/gi, 'ingredients')
}

export function tokenize(text, synonyms = {}) {
  return (normalize(text).match(/[a-z0-9]+/g) ?? [])
    .map((t) => synonyms[t] ?? t)
    .filter((t) => !STOP.has(t))
    .map(stem)
}

// First rule whose "all" patterns all match and whose "none" patterns do not.
export function compileRules(rules) {
  return rules.map((r) => ({
    intent: r.intent,
    all: (r.all ?? []).map((p) => new RegExp(p, 'i')),
    none: (r.none ?? []).map((p) => new RegExp(p, 'i')),
  }))
}

export function matchRule(text, compiled, { only } = {}) {
  const t = normalize(text)
  for (const r of compiled) {
    if (only && !only.has(r.intent)) continue
    if (r.all.every((re) => re.test(t)) && !r.none.some((re) => re.test(t))) return r.intent
  }
  return null
}

// Each intent scores the token count of every utterance phrase fully present in the text.
export function compileUtterances(intents, synonyms) {
  const out = []
  for (const [id, intent] of Object.entries(intents)) {
    const phrases = [...new Set((intent.utterances ?? []).map((u) => tokenize(u, synonyms).join(' ')))]
      .filter(Boolean)
      .map((p) => p.split(' '))
    if (phrases.length) out.push({ id, phrases })
  }
  return out
}

export function scoreIntents(text, compiled, synonyms, preferred) {
  const toks = new Set(tokenize(expandQuery(normalize(text)), synonyms))
  let best = { intent: null, score: 0 }
  for (const { id, phrases } of compiled) {
    let score = 0
    for (const p of phrases) if (p.every((t) => toks.has(t))) score += p.length
    if (score > best.score || (score > 0 && score === best.score && id === preferred)) best = { intent: id, score }
  }
  return best
}

// Slot values match on whole words/phrases of their synonyms (case-insensitive).
export function matchSlotValue(text, slot) {
  const t = ` ${normalize(text).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ')} `
  for (const v of slot.values) {
    const words = [v.label, v.value.replace(/_/g, ' '), ...(v.synonyms ?? [])].map((w) => normalize(w))
    if (words.some((w) => w && t.includes(` ${w} `))) return v
  }
  return null
}

// Text that equals a label of the buttons on screen ("yes", "no", "product").
export function matchLabel(text, buttons) {
  const t = normalize(text).replace(/[^a-z0-9 ]+/g, '').trim()
  if (!t) return null
  return buttons.find((b) => normalize(b.label).replace(/[^a-z0-9 ]+/g, '').trim() === t) ?? null
}
