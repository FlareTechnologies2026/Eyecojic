import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { sendTurn } from '../lib/chatApi'
import type { BotState, TurnInput, TurnResult } from '../lib/chatApi'
import {
  INDICATOR_FADE_MS,
  THINK_REDUCED_MS,
  countWords,
  remainingPause,
  revealDuration,
  thinkDelay,
  wordGap,
} from '../lib/reveal'
import { MinervaContext } from './minervaContext'
import type { MinervaHandoff, MinervaMessage } from './minervaContext'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Lives above the routes, so the conversation survives site -> /minerva -> back.
// Each turn: thinking indicator for at least THINK_MIN..MAX ms from send, indicator fades out,
// then the reply fades in word by word. `busy` stays true until the reveal has finished.
export function MinervaProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<MinervaMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [handoff, setHandoff] = useState<MinervaHandoff | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const busyRef = useRef(false)
  const nextId = useRef(1)
  const abortRef = useRef<AbortController | null>(null)
  const stateRef = useRef<BotState>({})
  // Every timer of the current turn; `gen` changes on reset so nothing stale can fire afterwards.
  const timers = useRef(new Set<number>())
  const gen = useRef(0)

  const cancelAll = useCallback(() => {
    gen.current++
    for (const id of timers.current) window.clearTimeout(id)
    timers.current.clear()
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => cancelAll, [cancelAll])

  const turn = useCallback((shown: string, input: Omit<TurnInput, 'state'>) => {
    if (!shown || busyRef.current) return
    busyRef.current = true
    setBusy(true)

    const myGen = gen.current
    const later = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        timers.current.delete(id)
        if (gen.current === myGen) fn()
      }, ms)
      timers.current.add(id)
    }

    const sentAt = Date.now()
    const reduced = reducedMotion()
    const minPause = reduced ? THINK_REDUCED_MS : thinkDelay()

    const userMsg: MinervaMessage = { id: nextId.current++, role: 'user', content: shown, createdAt: sentAt }
    const placeholder: MinervaMessage = {
      id: nextId.current++,
      role: 'assistant',
      content: '',
      pending: 'thinking',
      createdAt: sentAt,
    }
    setMessages((prev) => [...prev, userMsg, placeholder])

    const ac = new AbortController()
    abortRef.current = ac
    const replacePlaceholder = (bots: MinervaMessage[]) =>
      setMessages((prev) => prev.flatMap((m) => (m.id === placeholder.id ? bots : [m])))

    const finish = (ids: number[]) => {
      const at = Date.now()
      setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, revealed: true, revealedAt: at } : m)))
      busyRef.current = false
      setBusy(false)
    }

    // Show the reply: word-by-word reveal, or all at once under reduced motion.
    const showAnswer = (r: TurnResult | { error: string }) => {
      const isError = 'error' in r
      const texts = isError ? [r.error] : r.messages.map((m) => m.text).filter(Boolean)
      if (!texts.length) texts.push('Sorry, I could not answer that.')
      const counts = texts.map(countWords)
      const gap = wordGap(counts.reduce((a, b) => a + b, 0))
      const start = Date.now()
      let offset = 0
      const bots = texts.map<MinervaMessage>((content, i) => {
        const msg: MinervaMessage = {
          id: i === 0 ? placeholder.id : nextId.current++,
          role: 'assistant',
          content,
          revealed: reduced,
          revealAt: start + offset,
          wordGap: gap,
        }
        offset += counts[i] * gap // the next message's first word follows this one's last word by one gap
        return msg
      })
      const last = bots[bots.length - 1]
      if (!isError) {
        last.buttons = r.buttons ?? []
        if (r.handoff) {
          last.handoff = true
          setHandoff({ category: r.handoff.category, reason: r.handoff.reason })
        }
      }
      replacePlaceholder(bots)
      // Done when the last message's last word is fully visible.
      const lastCount = counts[counts.length - 1]
      const total = reduced ? 0 : offset - lastCount * gap + revealDuration(lastCount, gap)
      later(Math.max(0, total), () => finish(bots.map((b) => b.id)))
    }

    void (async () => {
      let r: TurnResult | { error: string }
      try {
        r = await sendTurn({ ...input, state: stateRef.current }, ac.signal)
      } catch (e) {
        if ((e as Error).name === 'AbortError' || gen.current !== myGen) return
        r = { error: 'Sorry, something went wrong. Please try again.' }
      }
      if (gen.current !== myGen) return
      if (!('error' in r)) stateRef.current = r.state ?? {}
      // Wait out the rest of the minimum pause (none if the server was slower), fade the indicator, then reveal.
      later(remainingPause(sentAt, Date.now(), minPause), () => {
        if (reduced) return showAnswer(r)
        setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? { ...m, pending: 'leaving' } : m)))
        later(INDICATOR_FADE_MS, () => showAnswer(r))
      })
    })()
  }, [])

  const send = useCallback((text: string) => {
    const q = text.trim().slice(0, 500)
    turn(q, { text: q })
  }, [turn])

  const sendButton = useCallback((value: string, label: string) => {
    turn(label.trim(), { button: value })
  }, [turn])

  const reset = useCallback(() => {
    cancelAll()
    busyRef.current = false
    stateRef.current = {}
    setBusy(false)
    setMessages([])
    setHandoff(null)
    setFormOpen(false)
  }, [cancelAll])

  const value = useMemo(() => {
    const last = messages[messages.length - 1]
    return {
      messages,
      busy,
      started: messages.length > 0,
      handoff,
      formOpen,
      buttons: !busy && last?.role === 'assistant' ? (last.buttons ?? []) : [],
      send,
      sendButton,
      reset,
      openForm: () => setFormOpen(true),
      closeForm: () => setFormOpen(false),
    }
  }, [messages, busy, handoff, formOpen, send, sendButton, reset])

  return <MinervaContext.Provider value={value}>{children}</MinervaContext.Provider>
}
