import type { ReactNode } from 'react'

// Turns emails, http(s) URLs and phone numbers in plain text into real links.
// Built from React nodes, never innerHTML, so message text cannot inject markup.
const RE = /(https?:\/\/[^\s<>)"]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}|\+?\d[\d\s-]{8,}\d)/g

export function linkify(text: string, linkClass = ''): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(RE)) {
    let token = m[0]
    const start = m.index ?? 0
    if (token.startsWith('http')) token = token.replace(/[.,;:!?]+$/, '')
    if (start > last) out.push(text.slice(last, start))
    let href: string
    if (token.startsWith('http')) href = token
    else if (token.includes('@')) href = `mailto:${token}`
    else href = `tel:${token.replace(/[^\d+]/g, '')}`
    out.push(
      <a
        key={n++}
        href={href}
        className={linkClass}
        {...(token.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {token}
      </a>,
    )
    last = start + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
