import { createContext } from 'react'
import type { QuickReply } from '../lib/chatApi'

export type MinervaMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  /** True when the assistant offered the human handoff on this turn. */
  handoff?: boolean
  /** Quick replies offered with this message. Only the latest bot message's buttons are active. */
  buttons?: QuickReply[]
}

export type MinervaHandoff = { category: string; reason: string }

export type MinervaState = {
  messages: MinervaMessage[]
  busy: boolean
  started: boolean
  handoff: MinervaHandoff | null
  formOpen: boolean
  /** Quick replies currently on screen (from the latest bot message). */
  buttons: QuickReply[]
  send: (text: string) => void
  sendButton: (value: string, label: string) => void
  reset: () => void
  openForm: () => void
  closeForm: () => void
}

export const MinervaContext = createContext<MinervaState | null>(null)
