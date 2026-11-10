import { createContext } from 'react'

export type MinervaMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  /** True when the assistant offered the human handoff on this turn. */
  handoff?: boolean
}

export type MinervaHandoff = { category: string; reason: string }

export type MinervaState = {
  messages: MinervaMessage[]
  busy: boolean
  started: boolean
  handoff: MinervaHandoff | null
  formOpen: boolean
  send: (text: string) => void
  reset: () => void
  openForm: () => void
  closeForm: () => void
}

export const MinervaContext = createContext<MinervaState | null>(null)
