// Hand-off from Minerva to the Contact page: router state and the subject label for each category.
// Pure (no React) so it can be unit tested from server/test.

export type HandoffInfo = { category: string; reason: string }
export type ContactState = { from: 'minerva'; category?: string; reason?: string }

/** Subject line prefilled on the Contact page for each Minerva handoff category. */
export const CATEGORY_SUBJECTS: Record<string, string> = {
  reaction: 'Skin or eye reaction',
  medical: 'Medical question',
  order: 'Order or payment',
  unanswered: 'Question for the team',
  requested_human: 'Speak with the team',
}

/** State passed with navigate('/contact', { state }). Without a handoff only `from` is set. */
export function contactState(h?: HandoffInfo | null): ContactState {
  return h ? { from: 'minerva', category: h.category, reason: h.reason } : { from: 'minerva' }
}

/** Reads router state defensively (it can be anything, or null after a reload). */
export function readContactState(state: unknown): { fromMinerva: boolean; category?: string; reason: string; subject: string } {
  const s = (state && typeof state === 'object' ? state : {}) as Record<string, unknown>
  const fromMinerva = s.from === 'minerva'
  const category = fromMinerva && typeof s.category === 'string' ? s.category : undefined
  const reason = fromMinerva && typeof s.reason === 'string' ? s.reason.slice(0, 500) : ''
  const subject = category ? (CATEGORY_SUBJECTS[category] ?? 'Question for the team') : ''
  return { fromMinerva, category, reason, subject }
}
