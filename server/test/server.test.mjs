import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDialog, loadIntents } from '../src/dialog.mjs'
import { tokenize, matchSlotValue } from '../src/matcher.mjs'
import { validateEscalation, sendEscalation, emailConfigured } from '../src/escalate.mjs'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const data = loadIntents()
const dialog = createDialog(data)
const say = (text, state) => dialog.respond({ text, state })
const press = (button, state) => dialog.respond({ button, state })
const allText = (r) => r.messages.map((m) => m.text).join(' ')
const labels = (r) => r.buttons.map((b) => b.label)

// --- data ----------------------------------------------------------------
test('intents.json is consistent: replies exist, buttons and slot targets resolve', () => {
  for (const [id, intent] of Object.entries(data.intents)) {
    assert.ok(intent.slot || intent.replies?.length, `${id} has replies or a slot`)
    for (const b of intent.buttons ?? []) {
      const value = typeof b === 'string' ? b : b.value
      assert.ok(data.intents[value], `${id} button ${value} points at an intent`)
      if (typeof b === 'string') assert.ok(data.buttons[b], `${id} button ${b} has a label`)
    }
    if (intent.slot) assert.ok(data.slots[intent.slot], `${id} slot exists`)
  }
  for (const [name, s] of Object.entries(data.slots)) {
    assert.ok(s.prompt && s.invalid && data.intents[s.next], `slot ${name} is complete`)
    assert.ok(s.values.length >= 2)
  }
  for (const r of data.rules) assert.ok(data.intents[r.intent], `rule target ${r.intent} exists`)
})

test('no reply makes a forbidden claim or names another brand', () => {
  const banned =
    /\b(cures?|cured|curing|treats?|treated|treating|treatment|heals?|healing|guarantee\w*|garnier|olay|l'?oreal|neutrogena|nivea|clinique|the ordinary|minimalist|mamaearth|plum|lakme|himalaya|biotique|pond'?s)\b/i
  const texts = [
    ...Object.values(data.intents).flatMap((i) => i.replies ?? []),
    ...Object.values(data.slots).flatMap((s) => [s.prompt, s.invalid]),
  ]
  for (const t of texts) assert.doesNotMatch(t, banned, t.slice(0, 80))
})

test('every intent and button from the Tina flow map is reachable with matching follow-ups', () => {
  const map = JSON.parse(readFileSync(join(dataDir, 'eyecojic_tina_flow_map.json'), 'utf8'))
  const trim = (list) => list.flat().map((s) => s.trim())

  const w = say('hi')
  assert.equal(w.state.intent, 'welcome')
  assert.deepEqual(labels(w), trim(map.welcome.buttons))
  assert.doesNotMatch(allText(w), /Tina/)
  assert.match(allText(w), /Minerva/)

  const screens = { EW_main_menu: 'main_menu', EW_AboutUs: 'about_us', EW_Product: 'product', EW_Buy: 'buy', EW_ContactUs: 'contact_us' }
  for (const [ew, id] of Object.entries(screens)) {
    const r = press(id)
    assert.equal(r.state.intent, id)
    assert.deepEqual(labels(r), trim(map.intents[ew].buttons), `${ew} buttons`)
    // Every button on the screen leads somewhere real.
    for (const b of r.buttons) assert.notEqual(press(b.value, r.state).state.intent, 'fallback', `${ew} -> ${b.label}`)
  }
  assert.equal(press('get_recommendations').state.slot, 'skin_tone')
})

test('replies carry no emoji or HTML anchors', () => {
  for (const t of Object.values(data.intents).flatMap((i) => i.replies ?? [])) {
    assert.doesNotMatch(t, /<a |\p{Extended_Pictographic}/u, t.slice(0, 60))
  }
})

// --- matching ------------------------------------------------------------
test('tokenizer stems, drops stopwords and applies synonyms', () => {
  assert.deepEqual(tokenize('How do I apply the gel?'), ['apply', 'gel'])
  assert.deepEqual(tokenize('kaise lagaye', { lagaye: 'apply' }), ['kaise', 'apply'])
})

test('welcome Yes / No go to recommendations / main menu, typed or pressed', () => {
  const w = say('hello')
  assert.equal(say('yes', w.state).state.slot, 'skin_tone')
  assert.equal(say('No', w.state).state.intent, 'main_menu')
  assert.equal(press('main_menu', w.state).state.intent, 'main_menu')
  assert.equal(say('menu').state.intent, 'main_menu')
})

test('button values route exactly; unknown buttons fall back', () => {
  assert.equal(press('size_price').state.intent, 'size_price')
  assert.equal(press('nope').state.intent, 'fallback')
  // Button wins over text when both are sent.
  assert.equal(dialog.respond({ text: 'my eyes burn', button: 'buy' }).state.intent, 'buy')
})

test('skin tone slot: buttons, synonyms, invalid input re-prompt, then recommendation', () => {
  const ask = press('get_recommendations')
  assert.match(allText(ask), /tell me your skin tone/)
  assert.deepEqual(labels(ask), ['Fair', 'Medium', 'Deep', 'Not sure', 'Main menu'])

  const bad = say('purple', ask.state)
  assert.equal(bad.state.slot, 'skin_tone', 'stays in the flow')
  assert.match(allText(bad), /did not catch that/)
  assert.deepEqual(labels(bad), labels(ask))

  const typed = say('I am wheatish', bad.state)
  assert.equal(typed.state.intent, 'recommendation')
  assert.equal(typed.state.slots.skin_tone, 'medium')
  assert.match(allText(typed), /formulated to help reduce the appearance of dark circles/)
  assert.match(allText(typed), /pea-sized/)
  assert.deepEqual(labels(typed), ['Buy', 'Product', 'Contact Us', 'Main menu'])

  const pressed = press('skin_tone=deep', ask.state)
  assert.equal(pressed.state.slots.skin_tone, 'deep')
  assert.equal(matchSlotValue('not sure', data.slots.skin_tone).value, 'not_sure')
  assert.equal(matchSlotValue('dusky', data.slots.skin_tone).value, 'deep')
})

test('safety beats a pending slot', () => {
  const ask = press('get_recommendations')
  const r = say('my eyes are burning and red', ask.state)
  assert.equal(r.state.intent, 'reaction_handoff')
  assert.equal(r.state.slot, undefined)
  assert.equal(r.handoff.category, 'reaction')
})

test('safety replies always hand off with the right category', () => {
  const r = say('I got a rash after using it')
  assert.match(allText(r), /stop using/i)
  assert.match(allText(r), /rinse the area gently/i)
  assert.match(allText(r), /see a doctor/i)
  assert.equal(r.handoff.category, 'reaction')
  assert.equal(say('Can I use it during pregnancy?').handoff.category, 'medical')
  assert.equal(say('where is my order?').handoff.category, 'order')
  assert.equal(say('I want to talk to a human').handoff.category, 'requested_human')
  // Shipping questions that mention an order are not order issues.
  assert.equal(say('When will my order be dispatched?').state.intent, 'shipping')
})

test('comparisons are declined without a handoff', () => {
  const r = say('Is it better than Garnier?')
  assert.equal(r.state.intent, 'comparison_decline')
  assert.equal(r.handoff, undefined)
})

test('unknown questions and known gaps fall back to a handoff, never a guess', () => {
  for (const q of ['What is the shelf life?', 'Any discount code?', 'Does it contain retinol?', 'Do you ship internationally?', 'qwerty asdf']) {
    const r = say(q)
    assert.equal(r.state.intent, 'fallback', q)
    assert.equal(r.handoff.category, 'unanswered')
    assert.match(r.handoff.reason, /Customer asked/)
  }
})

test('previously supported FAQs still answer from the old knowledge base wording', () => {
  assert.match(allText(say('How do I use it?')), /pea-sized/)
  assert.match(allText(say("What's in it?")), /2% Kojic Acid and Vitamin E/)
  assert.match(allText(say('How long until I see results?')), /2 to 4 weeks/)
  assert.match(allText(say('Is it safe for sensitive skin?')), /dermatologically tested/)
  assert.match(allText(say('Can I wear it under makeup?')), /concealer/)
  assert.match(allText(say('What is the price?')), /15 g.*Rs\. 349/)
  assert.match(allText(say('How long does delivery take?')), /5 to 7 business days/)
  assert.match(allText(say('What is your return policy?')), /7 days of delivery/)
  assert.match(allText(say('Where can I buy it?')), /Amazon, Flipkart and Myntra/)
  assert.match(allText(say('Who makes Eyecojic?')), /1973/)
  assert.match(allText(say('What is your phone number?')), /\+91-7840061316/)
  const dr = press('delivery_returns')
  assert.equal(dr.messages.length, 2)
})

test('state from the client is sanitised', () => {
  const r = dialog.respond({ text: 'purple', state: { intent: 'x', slot: 'evil', slots: { skin_tone: 'blue', a: 'b' } } })
  assert.equal(r.state.intent, 'fallback')
})

// --- escalation (unchanged) ----------------------------------------------
test('validateEscalation rejects bad input and cleans good input', () => {
  assert.equal(validateEscalation({}).ok, false)
  assert.equal(validateEscalation({ name: 'A', email: 'nope', message: 'hello there' }).errors.email.length > 0, true)
  const ok = validateEscalation({ name: 'Priya\r\nBcc: x@y.com', email: 'p@example.com', message: 'My eyes burn', consent: true, transcript: [{ role: 'user', content: 'hi' }] })
  assert.equal(ok.ok, true)
  assert.ok(!/[\r\n]/.test(ok.value.name))
})

test('escalation requires consent', () => {
  const r = validateEscalation({ name: 'A', email: 'a@b.co', message: 'hello there' })
  assert.equal(r.ok, false)
  assert.ok(r.errors.consent)
})

test('sendEscalation sets reply-to to the customer', async () => {
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
