import type { ReactNode } from 'react'
import ChatLink from '../components/ChatLink'

// Turns chat reply text into React nodes with links. Never uses innerHTML, so text cannot inject markup.
//  1. [label](target) markup from server/data/intents.json;
//  2. bare https:// URLs (shown as their hostname), emails and phone numbers.
// Only /path, https://, mailto: and tel: targets become links; anything else stays plain text.

export type LinkKind = 'internal' | 'external' | 'mailto' | 'tel'
export type LinkToken =
  | { type: 'text'; text: string }
  | { type: 'link'; label: string; href: string; kind: LinkKind }

const MARKUP = /\[([^\]\n]+)\]\(([^)\s]+)\)/g
const AUTO = /(https:\/\/[^\s<>)"]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}|\+?\d[\d\s-]{8,}\d)/g

export function linkKind(href: string): LinkKind | null {
  if (/^\/(?!\/)/.test(href)) return 'internal'
  if (/^https:\/\/[^\s/]+/i.test(href)) return 'external'
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return 'mailto'
  if (/^tel:\+?[\d-]+$/i.test(href)) return 'tel'
  return null
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function autoLink(text: string, out: LinkToken[]) {
  let last = 0
  for (const m of text.matchAll(AUTO)) {
    let token = m[0]
    const start = m.index ?? 0
    if (token.startsWith('https://')) token = token.replace(/[.,;:!?]+$/, '')
    if (start > last) out.push({ type: 'text', text: text.slice(last, start) })
    if (token.startsWith('https://')) out.push({ type: 'link', label: hostLabel(token), href: token, kind: 'external' })
    else if (token.includes('@')) out.push({ type: 'link', label: token, href: `mailto:${token}`, kind: 'mailto' })
    else out.push({ type: 'link', label: token, href: `tel:${token.replace(/[^\d+]/g, '')}`, kind: 'tel' })
    last = start + token.length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
}

/** Pure parser: text and link tokens, in order. */
export function parseLinks(text: string): LinkToken[] {
  const out: LinkToken[] = []
  let last = 0
  for (const m of text.matchAll(MARKUP)) {
    const start = m.index ?? 0
    if (start > last) autoLink(text.slice(last, start), out)
    const [, label, href] = m
    const kind = linkKind(href)
    out.push(kind ? { type: 'link', label, href, kind } : { type: 'text', text: label })
    last = start + m[0].length
  }
  if (last < text.length) autoLink(text.slice(last), out)
  return out
}

export function linkify(text: string): ReactNode[] {
  return parseLinks(text).map((t, i) =>
    t.type === 'text' ? (
      t.text
    ) : (
      <ChatLink key={i} href={t.href} kind={t.kind}>
        {t.label}
      </ChatLink>
    ),
  )
}
