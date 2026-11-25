// Client for the Eyecojic chat server (Minerva). No keys live here, and none are needed.
// Set VITE_CHAT_API_URL at build time for production; in dev the Vite proxy handles /api.
const BASE = (import.meta.env.VITE_CHAT_API_URL ?? '').replace(/\/$/, '')

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type QuickReply = { label: string; value: string }

/** Opaque dialog state from the server; sent back unchanged with the next turn. */
export type BotState = { intent?: string; slot?: string; slots?: Record<string, string> }

export type TurnResult = {
  messages: { text: string }[]
  buttons: QuickReply[]
  handoff?: { reason: string; category: string }
  state: BotState
}

export type TurnInput = { text?: string; button?: string; state: BotState }

/** One chat turn: plain JSON POST. Returns an error message instead of throwing on HTTP errors. */
export async function sendTurn(
  input: TurnInput,
  signal?: AbortSignal,
): Promise<TurnResult | { error: string }> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  const j = (await res.json().catch(() => null)) as (TurnResult & { error?: string }) | null
  if (!res.ok || !j || !Array.isArray(j.messages)) {
    return { error: j?.error || 'Sorry, the assistant is unavailable right now.' }
  }
  return j
}

export type EscalationInput = {
  name: string
  email: string
  message: string
  category: string
  consent: boolean
  /** Honeypot: must stay empty. Real users never see this field. */
  website: string
  transcript: ChatMessage[]
}

export type EscalationResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; error?: string }

export async function sendEscalation(input: EscalationInput): Promise<EscalationResult> {
  try {
    const res = await fetch(`${BASE}/api/escalate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    const j = (await res.json().catch(() => ({}))) as {
      errors?: Record<string, string>
      error?: string
    }
    if (res.ok) return { ok: true }
    return { ok: false, errors: j.errors, error: j.error }
  } catch {
    return { ok: false, error: 'Network error. Please email info@eyecojic.com.' }
  }
}
