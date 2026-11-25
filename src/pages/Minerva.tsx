import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import { Link, useNavigate } from 'react-router'
import Orb from '../components/minerva/Orb'
import { useMinerva } from '../hooks/useMinerva'
import { sendEscalation } from '../lib/chatApi'
import { renderReply } from '../lib/linkify'
import type { MinervaMessage } from '../context/minervaContext'

// Hero chips send intent ids (server/data/intents.json), not free text.
const CHIPS = [
  { label: 'How do I use it?', value: 'how_to_use' },
  { label: "What's in it?", value: 'key_ingredients' },
  { label: 'Is it safe for sensitive skin?', value: 'suitability_sensitive_skin' },
  { label: 'Delivery & returns', value: 'delivery_returns' },
  { label: 'Where to buy', value: 'buy' },
]
const DISCLAIMER =
  'Minerva is a virtual assistant, not a doctor. If your skin reacts, stop using the product and see a doctor.'

const SCROLL_MS = 300
// Approximates cubic-bezier(.22,1,.36,1), the easing of the orb move.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

const pill =
  'rounded-full border border-umber/15 bg-white/70 px-4 py-2 text-sm text-umber backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-umber'

export default function Minerva() {
  const m = useMinerva()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const heroInput = useRef<HTMLTextAreaElement>(null)
  const dockInput = useRef<HTMLTextAreaElement>(null)
  const [orb, setOrb] = useState<{ x: number; y: number; size: number } | null>(null)
  const [orbReady, setOrbReady] = useState(false)
  const [mountedAt] = useState(() => Date.now())

  useEffect(() => {
    const prev = document.title
    document.title = 'Minerva | Eyecojic'
    return () => {
      document.title = prev
    }
  }, [])

  // Orb: big in the hero slot when empty, small in the header once a conversation starts.
  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current
      if (!root) return
      const r = root.getBoundingClientRect()
      // Narrow screens: header pills fill the row, so the orb sits just below them.
      if (m.started) return setOrb({ x: r.width / 2, y: r.width < 640 ? 92 : 42, size: r.width < 640 ? 40 : 44 })
      const s = slotRef.current?.getBoundingClientRect()
      if (s) setOrb({ x: s.left - r.left + s.width / 2, y: s.top - r.top + s.height / 2, size: s.width })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (rootRef.current) ro.observe(rootRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [m.started])

  useEffect(() => {
    if (orb && !orbReady) {
      const id = requestAnimationFrame(() => setOrbReady(true))
      return () => cancelAnimationFrame(id)
    }
  }, [orb, orbReady])

  // Focus the input on load and when the layout switches.
  useEffect(() => {
    if (m.formOpen) return
    ;(m.started ? dockInput : heroInput).current?.focus()
  }, [m.started, m.formOpen])

  // Scrolling. Only runs when the shape of the list changes (a message added or replaced, the indicator
  // leaving), not when a finished reveal flips its flag, so it never fights a scroll in progress.
  //  - just sent (last message is the thinking placeholder): one smooth scroll to the bottom;
  //  - anything else (answer shown, reveal running): instant, and a long reply anchors to its first line.
  // The reveal only changes opacity, so the reply has its full height from the start and needs no follow.
  // Reduced motion: always instant. Only one scroll runs at a time: an instant one cancels the eased one.
  const scrollAnim = useRef(0)
  useEffect(() => () => cancelAnimationFrame(scrollAnim.current), [])
  const last = m.messages[m.messages.length - 1]
  const scrollKey = `${m.messages.length}:${last?.id ?? 0}:${last?.pending ?? ''}`
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const lastEl = el.querySelector<HTMLElement>('[data-last="true"]')
    const pad = window.innerWidth < 640 ? 136 : 88
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cancelAnimationFrame(scrollAnim.current)
    if (last?.pending === 'thinking' && !reduced) {
      // Eased scroll over ~300ms with the page's orb easing (rAF, so it is cancellable and browser-independent).
      const from = el.scrollTop
      const t0 = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / SCROLL_MS)
        const to = el.scrollHeight - el.clientHeight // re-read: the new rows may still be settling
        el.scrollTop = from + (to - from) * easeOut(t)
        if (t < 1) scrollAnim.current = requestAnimationFrame(step)
      }
      scrollAnim.current = requestAnimationFrame(step)
      return
    }
    if (lastEl && lastEl.offsetHeight > el.clientHeight - pad - 24) el.scrollTop = Math.max(0, lastEl.offsetTop - pad)
    else el.scrollTop = el.scrollHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollKey captures the changes that matter
  }, [scrollKey])

  // Escape closes the form, otherwise goes Home (only when nothing is half-typed).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (m.formOpen) m.closeForm()
      else if (!draft.trim()) navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [m, draft, navigate])

  const submit = (text = draft) => {
    if (!text.trim() || m.busy) return
    m.send(text)
    setDraft('')
  }

  // Buttons fade in only for replies revealed while this page is open; history renders instantly.
  // New bubbles (sent while this page is open) animate in; history and remounts render instantly.
  const isNew = (msg: MinervaMessage) => (msg.createdAt ?? 0) > mountedAt
  const fadeIfNew = (msg: MinervaMessage) => ((msg.revealedAt ?? 0) > mountedAt ? 'minerva-fade-in' : '')

  return (
    <div
      ref={rootRef}
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-ivory text-umber"
      style={{
        backgroundImage:
          'radial-gradient(60% 50% at 15% 10%, rgba(255,229,233,0.9) 0%, rgba(255,229,233,0) 70%), radial-gradient(55% 45% at 90% 85%, rgba(240,167,179,0.35) 0%, rgba(240,167,179,0) 70%)',
      }}
    >
      {/* header */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
        <div className="flex items-center gap-2">
          <Link to="/" className={pill}>
            Home
          </Link>
          {m.started && (
            <button onClick={m.reset} className={pill}>
              New chat
            </button>
          )}
        </div>
        <button onClick={m.openForm} className={pill}>
          Contact team
        </button>
      </header>

      {/* the one orb, moved between the hero slot and the header */}
      {orb && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            opacity: orbReady ? 1 : 0,
            transition: orbReady
              ? 'left 700ms cubic-bezier(.22,1,.36,1), top 700ms cubic-bezier(.22,1,.36,1), width 700ms cubic-bezier(.22,1,.36,1), height 700ms cubic-bezier(.22,1,.36,1), opacity 300ms'
              : 'none',
          }}
        >
          <Orb thinking={m.busy} />
        </div>
      )}

      {/* middle: hero (empty) or conversation */}
      <main className="relative z-10 min-h-0 flex-1">
        <section
          inert={m.started}
          aria-hidden={m.started}
          className={`absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center transition-opacity duration-500 ${m.started ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        >
          <div ref={slotRef} className="h-[130px] w-[130px] shrink-0 sm:h-[180px] sm:w-[180px]" />
          <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-umber/75">Meet Minerva</p>
          <h1 className="mt-3 font-serif text-4xl font-light leading-tight sm:text-5xl md:text-6xl">
            Your Eyecojic <em className="italic text-golddeep">guide.</em>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-umber/80 sm:text-base">
            Straight answers on ingredients, how to use the gel, delivery and returns.
          </p>
          <div className="mt-7 w-full max-w-xl">
            <Composer value={draft} onChange={setDraft} onSubmit={() => submit()} disabled={m.busy} inputRef={heroInput} />
          </div>
          <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
            {CHIPS.map((c) => (
              <button key={c.value} onClick={() => m.sendButton(c.value, c.label)} disabled={m.busy} className={pill}>
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <div
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-busy={m.busy}
          aria-label="Conversation with Minerva"
          data-lenis-prevent
          className={`absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-[136px] transition-opacity duration-500 [mask-image:linear-gradient(to_bottom,transparent_0,black_6rem)] sm:pt-[88px] sm:[mask-image:linear-gradient(to_bottom,transparent_0,black_4.5rem)] md:px-8 ${m.started ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div className="mx-auto flex max-w-[720px] flex-col gap-5">
            {m.messages.map((msg, i) => (
              <div key={msg.id} data-last={i === m.messages.length - 1} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                {msg.role === 'user' ? (
                  <p className={`${isNew(msg) ? 'minerva-bubble-in' : ''} max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-umber px-4 py-2.5 text-sm leading-relaxed text-ivory`}>
                    {msg.content}
                  </p>
                ) : (
                  <div className="max-w-[92%]">
                    {msg.pending ? (
                      <ThinkingIndicator leaving={msg.pending === 'leaving'} enter={isNew(msg)} />
                    ) : msg.revealed === false ? (
                      <RevealingReply text={msg.content} revealAt={msg.revealAt ?? 0} gap={msg.wordGap ?? 0} />
                    ) : (
                      renderReply(msg.content)
                    )}
                    {msg.handoff && msg.revealed !== false && (
                      <button onClick={m.openForm} className={`${fadeIfNew(msg)} mt-3 rounded-full bg-umber px-5 py-2 text-sm text-ivory transition-colors hover:bg-umber/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2`}>
                        Contact our team
                      </button>
                    )}
                    {i === m.messages.length - 1 && m.buttons.length > 0 && (
                      <div className={`${fadeIfNew(msg)} mt-3 flex flex-wrap gap-2`} role="group" aria-label="Quick replies">
                        {m.buttons.map((b) => (
                          <button key={b.value + b.label} onClick={() => m.sendButton(b.value, b.label)} className={pill}>
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* input dock, slides in after the first message */}
      <div
        inert={!m.started}
        className="relative z-20 grid transition-[grid-template-rows] duration-500"
        style={{ gridTemplateRows: m.started ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="mx-auto w-full max-w-[720px] px-4 pb-2 pt-2 md:px-8">
            <Composer value={draft} onChange={setDraft} onSubmit={() => submit()} disabled={m.busy} inputRef={dockInput} />
          </div>
        </div>
      </div>

      <p className="relative z-20 px-4 pb-3 pt-1 text-center text-[11px] leading-snug text-umber/75">{DISCLAIMER}</p>

      {m.formOpen && <HandoffDialog />}
    </div>
  )
}

// "Minerva is thinking" followed by the small thinking orb. Collapses on the outer element (max-height + opacity)
// with nothing clipped, so the orb's pulse never shows a rectangle edge.
function ThinkingIndicator({ leaving, enter }: { leaving: boolean; enter: boolean }) {
  return (
    <div
      className={`transition-[max-height,opacity,transform] duration-[280ms] ease-out motion-reduce:transition-none ${leaving ? 'max-h-0 -translate-y-1 opacity-0' : 'max-h-12 opacity-100'}`}
    >
      <span
        role="status"
        aria-label="Minerva is thinking"
        className={`${enter ? 'minerva-thinking-in' : ''} inline-flex items-center gap-2 py-0.5`}
      >
        <span aria-hidden="true" className="text-[15px] leading-relaxed text-umber">
          Minerva is thinking
        </span>
        <span aria-hidden="true" className="block h-[22px] w-[22px] shrink-0 p-px">
          <Orb thinking className="orb--sm" />
        </span>
      </span>
    </div>
  )
}

// Word-by-word fade-in. Delays are relative to when this mounted, so returning to the page mid-reveal
// resumes where it was (negative delays) instead of restarting. Hidden from screen readers: the log is
// aria-busy until the reveal ends, then the plain reply replaces this and is announced once.
function RevealingReply({ text, revealAt, gap }: { text: string; revealAt: number; gap: number }) {
  const [startMs] = useState(() => revealAt - Date.now())
  return <div aria-hidden="true">{renderReply(text, { startMs, gapMs: gap })}</div>
}

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSubmit()
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex items-end gap-2 rounded-[28px] border border-umber/15 bg-white p-2 pl-5 shadow-sm focus-within:border-bronze"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
        }}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={500}
        placeholder="Ask a question…"
        aria-label="Ask Minerva a question"
        className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-2.5 text-base text-umber outline-none placeholder:text-umber/65"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bronze text-white transition-[background-color,opacity] duration-150 hover:bg-golddeep focus:outline-none focus-visible:ring-2 focus-visible:ring-umber focus-visible:ring-offset-2 disabled:opacity-45"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
        </svg>
      </button>
    </form>
  )
}

function HandoffDialog() {
  const { messages, handoff, closeForm } = useMinerva()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(handoff?.reason ?? '')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setErrors({})
    setServerError('')
    const r = await sendEscalation({
      name,
      email,
      message,
      category: handoff?.category ?? 'other',
      consent,
      website,
      transcript: messages.map(({ role, content }) => ({ role, content })),
    })
    setSending(false)
    if (r.ok) setSent(true)
    else {
      setErrors(r.errors ?? {})
      if (r.error) setServerError(r.error)
    }
  }

  const field =
    'mt-1 w-full rounded-xl border border-umber/20 bg-white px-3.5 py-2.5 text-base text-umber outline-none focus:border-bronze'
  const err = 'mt-1 block text-xs text-[#B42318]'

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-umber/35 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="minerva-form-title"
        data-lenis-prevent
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-ivory p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="minerva-form-title" className="font-serif text-3xl font-light">
            Contact our team
          </h2>
          <button onClick={closeForm} aria-label="Close form" className="font-serif text-3xl leading-none text-umber/80 hover:text-umber">
            ×
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <p className="font-serif text-2xl italic">Thank you.</p>
            <p className="mt-2 text-sm text-umber/85">Your note is with our team. We will reply to {email}.</p>
            <button onClick={closeForm} className="mt-6 rounded-full bg-umber px-6 py-2.5 text-sm text-ivory">
              Back to chat
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <label className="block text-sm">
              Name
              <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
              {errors.name && <span className={err}>{errors.name}</span>}
            </label>
            <label className="block text-sm">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
              {errors.email && <span className={err}>{errors.email}</span>}
            </label>
            <label className="block text-sm">
              Your question
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} className={field} />
              {errors.message && <span className={err}>{errors.message}</span>}
            </label>
            {/* honeypot: hidden from people and assistive tech, bots fill it */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            <label className="flex items-start gap-3 text-sm leading-snug">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D94F68]" />
              <span>I agree that the Eyecojic team may contact me by email about this request.</span>
            </label>
            {errors.consent && <span className={err}>{errors.consent}</span>}
            {serverError && <p className="text-sm text-[#B42318]">{serverError}</p>}
            <button type="submit" disabled={sending} className="w-full rounded-full bg-umber py-3 text-sm font-medium text-ivory transition-colors hover:bg-umber/85 disabled:opacity-50">
              {sending ? 'Sending…' : 'Send to our team'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
