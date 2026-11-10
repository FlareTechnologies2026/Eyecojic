// Client for the Eyecojic chat server. No keys live here: the server holds them.
// Set VITE_CHAT_API_URL at build time for production; in dev the Vite proxy handles /api.
const BASE = (import.meta.env.VITE_CHAT_API_URL ?? '').replace(/\/$/, '')

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ChatEvent =
  | { type: 'text'; text: string }
  | { type: 'handoff'; reason: string; category: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })
  if (!res.ok || !res.body) {
    let message = 'Sorry, the assistant is unavailable right now.'
    try {
      const j = (await res.json()) as { error?: string }
      if (j.error) message = j.error
    } catch {
      /* keep default */
    }
    yield { type: 'error', message }
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const data = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('')
      if (!data) continue
      try {
        yield JSON.parse(data) as ChatEvent
      } catch {
        /* ignore malformed frame */
      }
    }
  }
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
