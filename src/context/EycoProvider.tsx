import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { streamChat } from '../lib/chatApi'
import { EycoContext } from './eycoContext'
import type { EycoHandoff, EycoMessage } from './eycoContext'

// Lives above the routes, so the conversation survives site -> /eyco -> back.
export function EycoProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<EycoMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [handoff, setHandoff] = useState<EycoHandoff | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const messagesRef = useRef<EycoMessage[]>([])
  const busyRef = useRef(false)
  const nextId = useRef(1)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = useCallback((text: string) => {
    const q = text.trim().slice(0, 500)
    if (!q || busyRef.current) return
    busyRef.current = true
    setBusy(true)

    const userMsg: EycoMessage = { id: nextId.current++, role: 'user', content: q }
    const botMsg: EycoMessage = { id: nextId.current++, role: 'assistant', content: '' }
    const history = [...messagesRef.current, userMsg]
    setMessages([...history, botMsg])

    const ac = new AbortController()
    abortRef.current = ac
    const patch = (fn: (m: EycoMessage) => EycoMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? fn(m) : m)))

    void (async () => {
      try {
        const payload = history.map(({ role, content }) => ({ role, content }))
        for await (const ev of streamChat(payload, ac.signal)) {
          if (ev.type === 'text') patch((m) => ({ ...m, content: m.content + ev.text }))
          else if (ev.type === 'handoff') {
            setHandoff({ category: ev.category, reason: ev.reason })
            patch((m) => ({ ...m, handoff: true }))
          } else if (ev.type === 'error') patch((m) => ({ ...m, content: m.content || ev.message }))
        }
        patch((m) => (m.content ? m : { ...m, content: 'Sorry, I could not answer that.' }))
      } catch (e) {
        if ((e as Error).name !== 'AbortError')
          patch((m) => ({ ...m, content: m.content || 'Sorry, something went wrong. Please try again.' }))
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    })()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    busyRef.current = false
    setBusy(false)
    setMessages([])
    setHandoff(null)
    setFormOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      messages,
      busy,
      started: messages.length > 0,
      handoff,
      formOpen,
      send,
      reset,
      openForm: () => setFormOpen(true),
      closeForm: () => setFormOpen(false),
    }),
    [messages, busy, handoff, formOpen, send, reset],
  )

  return <EycoContext.Provider value={value}>{children}</EycoContext.Provider>
}
