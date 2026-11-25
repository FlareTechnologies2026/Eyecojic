import type { CSSProperties, ReactNode } from 'react'
import ChatLink from '../components/ChatLink'
import { parseBlocks, parseInline } from './chatFormat'
import { wordPieces } from './reveal'

// Renders Minerva reply text as React nodes (never innerHTML, so text cannot inject markup).
// Parsing lives in ./chatFormat (pure, tested); this file only maps tokens to elements.

/** Word-by-word fade-in: word i starts at startMs + i * gapMs (startMs may be negative to resume mid-way). */
export type Reveal = { startMs: number; gapMs: number }

type Counter = { i: number; reveal: Reveal }
const delayOf = (c: Counter, i: number): CSSProperties => ({ animationDelay: `${c.reveal.startMs + i * c.reveal.gapMs}ms` })

export function linkify(text: string, counter?: Counter): ReactNode[] {
  return parseInline(text).map((t, i) => {
    let node: ReactNode
    if (t.type === 'link') {
      node = (
        <ChatLink key={i} href={t.href} kind={t.kind}>
          {t.label}
        </ChatLink>
      )
      // A link appears as one whole word.
      if (counter)
        node = (
          <span key={i} className="minerva-word" style={delayOf(counter, counter.i++)}>
            {node}
          </span>
        )
    } else if (counter) {
      node = wordPieces(t.text).map((p, j) =>
        /^\s+$/.test(p) ? (
          p
        ) : (
          <span key={j} className="minerva-word" style={delayOf(counter, counter.i++)}>
            {p}
          </span>
        ),
      )
    } else node = t.text
    return t.bold ? (
      <strong key={i} className="font-semibold">
        {node}
      </strong>
    ) : (
      <span key={i} className="contents">
        {node}
      </span>
    )
  })
}

const para = 'whitespace-pre-wrap break-words text-[15px] leading-relaxed'

/**
 * A whole reply: paragraphs and bronze-dot bullet lists, ~12px between blocks, ~4px between items.
 * With `reveal`, words fade in one by one in reading order; each bullet (marker included) appears with its first word.
 */
export function renderReply(text: string, reveal?: Reveal): ReactNode {
  const counter: Counter | undefined = reveal && { i: 0, reveal }
  return (
    <div className="space-y-3">
      {parseBlocks(text).map((b, i) =>
        b.type === 'paragraph' ? (
          <p key={i} className={para}>
            {linkify(b.text, counter)}
          </p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-bronze">
            {b.items.map((item, j) => (
              <li
                key={j}
                className={`${para} pl-0.5 ${counter ? 'minerva-word' : ''}`}
                style={counter ? delayOf(counter, counter.i) : undefined}
              >
                {linkify(item, counter)}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}
