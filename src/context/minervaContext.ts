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
  /** Placeholder for a reply still on its way: the thinking indicator, then its fade-out. */
  pending?: 'thinking' | 'leaving'
  /** false while the words are fading in; true (or undefined) once the text is fully shown. */
  revealed?: boolean
  /** Epoch ms when this message's first word starts fading in, and the delay between words. */
  revealAt?: number
  wordGap?: number
  /** Epoch ms when the reveal finished (used to fade in the buttons only right after it). */
  revealedAt?: number
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
