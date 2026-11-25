// Minerva -> Contact page hand-off (src/lib/contactHandoff.ts) and the contact form's escalation email.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contactState, readContactState, CATEGORY_SUBJECTS } from '../../src/lib/contactHandoff.ts'
import { validateEscalation, sendEscalation } from '../src/escalate.mjs'
import { createDialog } from '../src/dialog.mjs'

test('a Minerva handoff becomes navigation state with category and reason', () => {
  const reply = createDialog().respond({ text: 'my skin is burning after using it' })
  const state = contactState(reply.handoff)
  assert.deepEqual(state, { from: 'minerva', category: 'reaction', reason: reply.handoff.reason })
  assert.deepEqual(contactState(null), { from: 'minerva' })
})

test('the Contact page reads the state into a subject label and message', () => {
  const r = readContactState({ from: 'minerva', category: 'reaction', reason: 'Customer reports a skin or eye reaction after use.' })
  assert.equal(r.fromMinerva, true)
  assert.equal(r.subject, CATEGORY_SUBJECTS.reaction)
  assert.match(r.reason, /reaction/)
  for (const c of ['reaction', 'medical', 'order', 'unanswered', 'requested_human']) assert.ok(CATEGORY_SUBJECTS[c], c)
  // Anything else (reload, other pages, junk) prefills nothing.
  for (const s of [null, undefined, 'x', { from: 'other', category: 'reaction', reason: 'r' }]) {
    const e = readContactState(s)
    assert.equal(e.fromMinerva, false)
    assert.equal(e.subject, '')
    assert.equal(e.reason, '')
  }
})

test('contact_form messages are accepted and the email subject reads "[Eyecojic] contact_form from <name>"', async () => {
  const v = validateEscalation({
    name: 'Priya',
    email: 'priya@example.com',
    message: 'Subject: Product enquiry\n\nDo you ship to Pune?',
    category: 'contact_form',
    consent: true,
    transcript: [],
  })
  assert.equal(v.ok, true)
  const sent = []
  const env = { SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'bot@site.com', ESCALATION_TO: 'team@site.com' }
  await sendEscalation(v.value, { env, transport: { sendMail: async (m) => sent.push(m) } })
  assert.equal(sent[0].subject, '[Eyecojic] contact_form from Priya')
  assert.match(sent[0].text, /contact form message/)
})
