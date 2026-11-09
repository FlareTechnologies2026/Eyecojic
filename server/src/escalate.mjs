// Human handoff: validate, email the team (customer address as reply-to), log to data/escalations.jsonl.
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import nodemailer from 'nodemailer'

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim()

export function emailConfigured(env = process.env) {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM && env.ESCALATION_TO)
}

export function validateEscalation(body) {
  const name = oneLine(body?.name).slice(0, 100)
  const email = oneLine(body?.email).slice(0, 200)
  const phone = oneLine(body?.phone).slice(0, 30)
  const message = String(body?.message ?? '').trim().slice(0, 2000)
  const category = oneLine(body?.category).slice(0, 30)
  const transcript = Array.isArray(body?.transcript)
    ? body.transcript
        .slice(-10)
        .map((m) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          content: String(m?.content ?? '').slice(0, 1000),
        }))
    : []
  const errors = {}
  if (!name) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.'
  if (message.length < 5) errors.message = 'Please tell us a little more.'
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { name, email, phone, message, category, transcript } }
}

export function createTransport(env = process.env) {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: String(env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
}

export async function sendEscalation(value, { env = process.env, transport, logFile }) {
  const record = { at: new Date().toISOString(), ...value }
  // Log first so a mail failure never loses the customer's message.
  if (logFile) {
    await mkdir(dirname(logFile), { recursive: true })
    await appendFile(logFile, JSON.stringify(record) + '\n', 'utf8')
  }
  if (!emailConfigured(env)) return { emailed: false, reason: 'email-not-configured' }

  const convo = value.transcript.length
    ? '\n\n--- Recent chat ---\n' + value.transcript.map((m) => `${m.role}: ${m.content}`).join('\n')
    : ''
  const text =
    `New Eyecojic chat handoff\n\nName: ${value.name}\nEmail: ${value.email}\n` +
    `Phone: ${value.phone || 'not given'}\nTopic: ${value.category || 'not set'}\n\n` +
    `Message:\n${value.message}${convo}\n`

  await (transport ?? createTransport(env)).sendMail({
    from: env.SMTP_FROM,
    to: env.ESCALATION_TO,
    replyTo: { name: value.name.replace(/["<>]/g, ''), address: value.email },
    subject: `[Eyecojic chat] ${value.category || 'Handoff'} from ${value.name}`.slice(0, 200),
    text,
  })
  return { emailed: true }
}
