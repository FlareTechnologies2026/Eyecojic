import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { sendEscalation, streamChat } from '../lib/chatApi'
import type { ChatMessage } from '../lib/chatApi'

const STARTERS = [
  'What does the gel do?',
  'How do I use it?',
  'Is it safe for sensitive skin?',
  'Shipping and returns',
]

const GREETING =
  'Hi! I can answer questions about Eyecojic Under Eye Gel, shipping and returns. What would you like to know?'

type Msg = ChatMessage & { handoff?: boolean }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'chat' | 'handoff'>('chat')
  const [category, setCategory] = useState('other')
  const [prefill, setPrefill] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open && view === 'chat') inputRef.current?.focus()
  }, [open, view])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, view, open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput('')
    const history: Msg[] = [...messages, { role: 'user', content: q }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)
    const ac = new AbortController()
    abortRef.current = ac
    const patchLast = (fn: (m: Msg) => Msg) =>
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)))
    try {
      const payload = history.map(({ role, content }) => ({ role, content }))
      for await (const ev of streamChat(payload, ac.signal)) {
        if (ev.type === 'text') patchLast((m) => ({ ...m, content: m.content + ev.text }))
        else if (ev.type === 'handoff') {
          setCategory(ev.category)
          setPrefill(ev.reason)
          patchLast((m) => ({ ...m, handoff: true }))
        } else if (ev.type === 'error') patchLast((m) => ({ ...m, content: m.content || ev.message }))
      }
      patchLast((m) =>
        m.content
          ? m
          : { ...m, content: m.handoff ? 'I will pass this to our team.' : 'Sorry, I could not answer that.' },
      )
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        patchLast((m) => ({ ...m, content: m.content || 'Sorry, something went wrong. Please try again.' }))
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void ask(input)
  }

  const openHandoff = () => {
    setView('handoff')
    setOpen(true)
  }

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="fixed bottom-4 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-bronze text-ivory shadow-lg transition-colors hover:bg-golddeep focus:outline-none focus-visible:ring-2 focus-visible:ring-umber focus-visible:ring-offset-2 md:bottom-6 md:right-6"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6 3-3h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14Z" />
          </svg>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Eyecojic assistant"
          className="fixed bottom-4 right-4 z-[55] flex h-[min(34rem,calc(100dvh-6rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-umber/10 bg-ivory shadow-2xl sm:w-[380px] md:bottom-6 md:right-6"
        >
          <div className="flex items-center justify-between bg-umber px-4 py-3 text-ivory">
            <div>
              <p className="font-serif text-lg leading-none">Eyecojic assistant</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-ivory/70">Ask us anything</p>
            </div>
            <div className="flex items-center gap-3">
              {view === 'chat' ? (
                <button onClick={openHandoff} className="text-[11px] uppercase tracking-[0.15em] text-ivory/80 underline-offset-4 hover:underline">
                  Contact team
                </button>
              ) : (
                <button onClick={() => setView('chat')} className="text-[11px] uppercase tracking-[0.15em] text-ivory/80 underline-offset-4 hover:underline">
                  Back to chat
                </button>
              )}
              <button onClick={close} aria-label="Close chat" className="font-serif text-2xl leading-none text-ivory/80 hover:text-ivory">
                ×
              </button>
            </div>
          </div>

          {view === 'chat' ? (
            <>
              {/* data-lenis-prevent lets this panel scroll natively inside the Lenis page */}
              <div ref={scrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
                <Bubble role="assistant" text={GREETING} />
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STARTERS.map((s) => (
                      <button key={s} onClick={() => void ask(s)} className="rounded-full border border-bronze/40 bg-cream px-3 py-1.5 text-xs text-umber transition-colors hover:bg-sand/40">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i}>
                    <Bubble role={m.role} text={m.content || (busy && i === messages.length - 1 ? '…' : '')} />
                    {m.handoff && (
                      <button onClick={openHandoff} className="mt-2 rounded-full bg-bronze px-4 py-1.5 text-xs font-medium text-ivory hover:bg-golddeep">
                        Contact our team
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex gap-2 border-t border-umber/10 bg-ivory p-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Type your question"
                  aria-label="Your message"
                  className="min-w-0 flex-1 rounded-full border border-umber/15 bg-white px-4 py-2 text-sm text-umber outline-none focus:border-bronze"
                />
                <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-bronze px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-golddeep disabled:opacity-50">
                  Send
                </button>
              </form>
            </>
          ) : (
            <HandoffForm
              category={category}
              prefill={prefill}
              transcript={messages.map(({ role, content }) => ({ role, content }))}
              onDone={() => setView('chat')}
            />
          )}
        </div>
      )}
    </>
  )
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const mine = role === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine ? 'bg-bronze text-ivory' : 'bg-cream text-umber'}`}>
        {text}
      </p>
    </div>
  )
}

function HandoffForm({
  category,
  prefill,
  transcript,
  onDone,
}: {
  category: string
  prefill: string
  transcript: ChatMessage[]
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(prefill)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setErrors({})
    setServerError('')
    const r = await sendEscalation({ name, email, phone, message, category, transcript })
    setSending(false)
    if (r.ok) setSent(true)
    else {
      setErrors(r.errors ?? {})
      if (r.error) setServerError(r.error)
    }
  }

  if (sent)
    return (
      <div data-lenis-prevent className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-2xl italic text-umber">Thank you.</p>
        <p className="text-sm text-umber/80">Your note is with our team. We will reply to {email}.</p>
        <button onClick={onDone} className="rounded-full bg-bronze px-5 py-2 text-sm text-ivory hover:bg-golddeep">
          Back to chat
        </button>
      </div>
    )

  const field = 'w-full rounded-lg border border-umber/15 bg-white px-3 py-2 text-sm text-umber outline-none focus:border-bronze'
  return (
    <form onSubmit={submit} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" noValidate>
      <p className="text-xs text-umber/70">Share your details and our team will email you back.</p>
      <label className="block text-xs text-umber">
        Name *
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
        {errors.name && <span className="text-[11px] text-destructive">{errors.name}</span>}
      </label>
      <label className="block text-xs text-umber">
        Email *
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
        {errors.email && <span className="text-[11px] text-destructive">{errors.email}</span>}
      </label>
      <label className="block text-xs text-umber">
        Phone (optional)
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={field} />
      </label>
      <label className="block text-xs text-umber">
        How can we help? *
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} className={field} />
        {errors.message && <span className="text-[11px] text-destructive">{errors.message}</span>}
      </label>
      {serverError && <p className="text-xs text-destructive">{serverError}</p>}
      <button type="submit" disabled={sending} className="w-full rounded-full bg-bronze py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-golddeep disabled:opacity-50">
        {sending ? 'Sending…' : 'Send to our team'}
      </button>
    </form>
  )
}
