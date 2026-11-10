import { createContext } from 'react'

export type EycoMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  /** True when the assistant offered the human handoff on this turn. */
  handoff?: boolean
}

export type EycoHandoff = { category: string; reason: string }

export type EycoState = {
  messages: EycoMessage[]
  busy: boolean
  started: boolean
  handoff: EycoHandoff | null
  formOpen: boolean
  send: (text: string) => void
  reset: () => void
  openForm: () => void
  closeForm: () => void
}

export const EycoContext = createContext<EycoState | null>(null)
