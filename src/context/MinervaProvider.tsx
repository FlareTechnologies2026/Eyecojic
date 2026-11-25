import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { sendTurn } from '../lib/chatApi'
import type { BotState, TurnInput } from '../lib/chatApi'
import { MinervaContext } from './minervaContext'
import type { MinervaHandoff, MinervaMessage } from './minervaContext'

// Lives above the routes, so the conversation survives site -> /minerva -> back.
export function MinervaProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<MinervaMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [handoff, setHandoff] = useState<MinervaHandoff | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const busyRef = useRef(false)
  const nextId = useRef(1)
  const abortRef = useRef<AbortController | null>(null)
  const stateRef = useRef<BotState>({})

  useEffect(() => () => abortRef.current?.abort(), [])

  // One turn: show the user's bubble and a typing placeholder, then replace it with the replies.
  const turn = useCallback((shown: string, input: Omit<TurnInput, 'state'>) => {
    if (!shown || busyRef.current) return
    busyRef.current = true
    setBusy(true)

    const userMsg: MinervaMessage = { id: nextId.current++, role: 'user', content: shown }
    const placeholder: MinervaMessage = { id: nextId.current++, role: 'assistant', content: '' }
    setMessages((prev) => [...prev, userMsg, placeholder])

    const ac = new AbortController()
    abortRef.current = ac
    const replacePlaceholder = (bots: MinervaMessage[]) =>
      setMessages((prev) => prev.flatMap((m) => (m.id === placeholder.id ? bots : [m])))

    void (async () => {
      try {
        const r = await sendTurn({ ...input, state: stateRef.current }, ac.signal)
        if ('error' in r) {
          replacePlaceholder([{ ...placeholder, content: r.error }])
          return
        }
        stateRef.current = r.state ?? {}
        const texts = r.messages.map((m) => m.text).filter(Boolean)
        if (!texts.length) texts.push('Sorry, I could not answer that.')
        const bots = texts.map<MinervaMessage>((content, i) => ({
          id: i === 0 ? placeholder.id : nextId.current++,
          role: 'assistant',
          content,
        }))
        const last = bots[bots.length - 1]
        last.buttons = r.buttons ?? []
        if (r.handoff) {
          last.handoff = true
          setHandoff({ category: r.handoff.category, reason: r.handoff.reason })
        }
        replacePlaceholder(bots)
      } catch (e) {
        if ((e as Error).name !== 'AbortError')
          replacePlaceholder([{ ...placeholder, content: 'Sorry, something went wrong. Please try again.' }])
      } finally {
        if (abortRef.current === ac) {
          busyRef.current = false
          setBusy(false)
        }
      }
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
    abortRef.current?.abort()
    abortRef.current = null
    busyRef.current = false
    stateRef.current = {}
    setBusy(false)
    setMessages([])
    setHandoff(null)
    setFormOpen(false)
  }, [])

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
