// Timing for Minerva's "thinking" pause and word-by-word reveal. Pure: no React, no DOM, so it can be unit tested.
import { parseBlocks, parseInline } from './chatFormat.ts'

/** Minimum time the thinking indicator shows, measured from send; a random value in this range per reply. */
export const THINK_MIN_MS = 2000
export const THINK_MAX_MS = 2500
/** Thinking pause under prefers-reduced-motion (no fade, reply shown at once). */
export const THINK_REDUCED_MS = 600
/** Indicator fade-and-collapse before the answer starts. */
export const INDICATOR_FADE_MS = 280
/** Each word fades in over this long... */
export const WORD_FADE_MS = 150
/** ...starting this long after the previous word... */
export const WORD_GAP_MS = 35
/** ...unless that would make the whole turn take longer than this. */
export const REVEAL_CAP_MS = 4000
/** Quick replies and "Contact our team" fade in after the reveal. */
export const BUTTONS_FADE_MS = 250

/** Random minimum pause for one reply, in [THINK_MIN_MS, THINK_MAX_MS]. */
export function thinkDelay(random: () => number = Math.random): number {
  const r = Math.min(Math.max(random(), 0), 1)
  return Math.round(THINK_MIN_MS + r * (THINK_MAX_MS - THINK_MIN_MS))
}

/** Remaining wait once the reply is in: never negative, no extra delay if the server was slow. */
export function remainingPause(sentAt: number, now: number, minMs: number): number {
  return Math.max(0, minMs - (now - sentAt))
}

/** Per-word delay: WORD_GAP_MS, shortened so the reveal finishes within about REVEAL_CAP_MS. */
export function wordGap(totalWords: number): number {
  if (totalWords <= 1) return WORD_GAP_MS
  return Math.min(WORD_GAP_MS, (REVEAL_CAP_MS - WORD_FADE_MS) / (totalWords - 1))
}

/** Time from the first word starting to the last word fully visible. */
export function revealDuration(words: number, gap: number): number {
  return words > 0 ? (words - 1) * gap + WORD_FADE_MS : 0
}

/** Splits plain text into words and the whitespace between them (whitespace is kept, never animated). */
export function wordPieces(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean)
}

const isSpace = (s: string) => /^\s+$/.test(s)

/** Number of reveal steps in a reply: each word is one, each link is one (links appear whole). */
export function countWords(text: string): number {
  let n = 0
  for (const b of parseBlocks(text)) {
    for (const line of b.type === 'paragraph' ? [b.text] : b.items) {
      for (const t of parseInline(line)) {
        if (t.type === 'link') n++
        else n += wordPieces(t.text).filter((p) => !isSpace(p)).length
      }
    }
  }
  return n
}
