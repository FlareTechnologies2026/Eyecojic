import type { ReactNode } from 'react'
import ChatLink from '../components/ChatLink'
import { parseBlocks, parseInline } from './chatFormat'

// Renders Minerva reply text as React nodes (never innerHTML, so text cannot inject markup).
// Parsing lives in ./chatFormat (pure, tested); this file only maps tokens to elements.

export function linkify(text: string): ReactNode[] {
  return parseInline(text).map((t, i) => {
    const node =
      t.type === 'text' ? (
        t.text
      ) : (
        <ChatLink key={i} href={t.href} kind={t.kind}>
          {t.label}
        </ChatLink>
      )
    return t.bold ? (
      <strong key={i} className="font-semibold">
        {node}
      </strong>
    ) : (
      node
    )
  })
}

const para = 'whitespace-pre-wrap break-words text-[15px] leading-relaxed'

/** A whole reply: paragraphs and bronze-dot bullet lists, ~12px between blocks, ~4px between items. */
export function renderReply(text: string): ReactNode {
  return (
    <div className="space-y-3">
      {parseBlocks(text).map((b, i) =>
        b.type === 'paragraph' ? (
          <p key={i} className={para}>
            {linkify(b.text)}
          </p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-bronze">
            {b.items.map((item, j) => (
              <li key={j} className={`${para} pl-0.5`}>
                {linkify(item)}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}
