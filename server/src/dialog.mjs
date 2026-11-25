// Minerva dialog engine: stateless intent-and-slot bot driven by data/intents.json.
// respond({ text, button, state }) -> { messages, buttons, handoff?, state }
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  compileRules,
  compileUtterances,
  matchLabel,
  matchRule,
  matchSlotValue,
  scoreIntents,
} from './matcher.mjs'

export const INTENTS_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'intents.json')

// Safety rules beat everything typed, including a pending slot question.
const SAFETY = new Set(['reaction_handoff', 'medical_handoff', 'order_handoff', 'human_handoff'])

export function loadIntents(file = INTENTS_FILE) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function createDialog(data = loadIntents()) {
  const { intents, slots = {}, synonyms = {}, buttons: labels = {} } = data
  const rules = compileRules(data.rules ?? [])
  const utterances = compileUtterances(intents, synonyms)

  const toButton = (b) => (typeof b === 'string' ? { label: labels[b] ?? b, value: b } : { label: b.label, value: b.value })

  function replies(id, seen = new Set()) {
    if (seen.has(id)) return []
    seen.add(id)
    return (intents[id]?.replies ?? []).flatMap((r) => (r.startsWith('@') ? replies(r.slice(1), seen) : [r]))
  }

  function slotButtons(name) {
    const s = slots[name]
    return [...s.values.map((v) => ({ label: v.label, value: `${name}=${v.value}` })), ...(s.buttons ?? []).map(toButton)]
  }

  // Buttons currently on screen for a state (used to accept typed labels such as "yes").
  function screenButtons(state) {
    if (state.slot && slots[state.slot]) return slotButtons(state.slot)
    return (intents[state.intent]?.buttons ?? []).map(toButton)
  }

  function enter(id, { text = '', slotValues = {} } = {}) {
    const intent = intents[id] ?? intents.fallback
    const intentId = intents[id] ? id : 'fallback'
    if (intent.slot && slots[intent.slot]) {
      const s = slots[intent.slot]
      return {
        messages: [...replies(intentId), s.prompt].map((t) => ({ text: t })),
        buttons: slotButtons(intent.slot),
        state: { intent: intentId, slot: intent.slot, slots: slotValues },
      }
    }
    const out = {
      messages: replies(intentId).map((t) => ({ text: fill(t, slotValues) })),
      buttons: (intent.buttons ?? []).map(toButton),
      state: { intent: intentId, slots: slotValues },
    }
    if (intent.handoff)
      out.handoff = {
        category: intent.handoff.category,
        reason: intent.handoff.reason.replace('{text}', text.slice(0, 160)),
      }
    return out
  }

  function fill(t, slotValues) {
    return t.replace(/\{(\w+)\}/g, (m, k) => {
      const v = slots[k]?.values.find((x) => x.value === slotValues[k])
      return v ? v.label : m
    })
  }

  function fillSlot(state, value) {
    const s = slots[state.slot]
    const slotValues = { ...state.slots, [state.slot]: value.value }
    const res = enter(s.next, { slotValues })
    return res
  }

  function reprompt(state) {
    const s = slots[state.slot]
    return {
      messages: [{ text: s.invalid }],
      buttons: slotButtons(state.slot),
      state: { intent: state.intent, slot: state.slot, slots: state.slots },
    }
  }

  function respond({ text = '', button = '', state: rawState } = {}) {
    const state = cleanState(rawState)
    text = String(text ?? '').slice(0, 500)
    button = String(button ?? '').slice(0, 100)

    // 1. Buttons: exact ids only.
    if (button) {
      const eq = button.indexOf('=')
      if (eq > 0) {
        const name = button.slice(0, eq)
        const v = slots[name]?.values.find((x) => x.value === button.slice(eq + 1))
        if (v && state.slot === name) return fillSlot(state, v)
        if (v) return enter(intentForSlot(name), { slotValues: state.slots })
        return enter('fallback', { text: button })
      }
      if (intents[button]) return enter(button, { slotValues: state.slots })
      return enter('fallback', { text: button })
    }

    if (!text.trim()) return enter('main_menu')

    // 2. Safety first, always.
    const safety = matchRule(text, rules, { only: SAFETY })
    if (safety) return enter(safety, { text })

    // 3. A pending slot keeps the user in the flow until it is answered.
    if (state.slot && slots[state.slot]) {
      const v = matchSlotValue(text, slots[state.slot])
      if (v) return fillSlot(state, v)
      const nav = matchLabel(text, screenButtons(state))
      if (nav && !nav.value.includes('=')) return enter(nav.value)
      return reprompt(state)
    }

    // 4-5. Comparisons, known gaps, greetings, thanks.
    const rule = matchRule(text, rules)
    if (rule) return enter(rule, { text })

    // A typed button label ("yes", "about us") acts like the button.
    const label = matchLabel(text, screenButtons(state))
    if (label) return enter(label.value, { slotValues: state.slots })

    // 6. Keyword scoring; ties go to the current intent.
    const best = scoreIntents(text, utterances, synonyms, state.intent)
    if (best.intent) return enter(best.intent, { text, slotValues: state.slots })

    // 7. Anything else.
    return enter('fallback', { text })
  }

  function intentForSlot(name) {
    return Object.keys(intents).find((id) => intents[id].slot === name) ?? 'fallback'
  }

  function cleanState(s) {
    const out = { intent: undefined, slot: undefined, slots: {} }
    if (!s || typeof s !== 'object') return out
    if (typeof s.intent === 'string' && intents[s.intent]) out.intent = s.intent
    if (typeof s.slot === 'string' && slots[s.slot]) out.slot = s.slot
    if (s.slots && typeof s.slots === 'object')
      for (const [k, v] of Object.entries(s.slots))
        if (slots[k] && typeof v === 'string' && slots[k].values.some((x) => x.value === v)) out.slots[k] = v
    return out
  }

  return { respond, intentCount: Object.keys(intents).length, data }
}
