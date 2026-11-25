// Pure parsers for Minerva reply text (no React, so server tests can import this file directly).
//  - blocks: lines starting with "• " (U+2022 + space) form bullet lists; other lines are paragraphs.
//    A leading "- " is never a bullet.
//  - inline: **bold** spans, [label](target) links, then bare https URLs, emails and phone numbers.
// Only /path, https://, mailto: and tel: targets become links; anything else stays plain text.

export type LinkKind = 'internal' | 'external' | 'mailto' | 'tel'
export type LinkToken =
  | { type: 'text'; text: string }
  | { type: 'link'; label: string; href: string; kind: LinkKind }
export type InlineToken = LinkToken & { bold?: boolean }
export type Block = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] }

const BULLET = '• '
const MARKUP = /\[([^\]\n]+)\]\(([^)\s]+)\)/g
const AUTO = /(https:\/\/[^\s<>)"]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}|\+?\d[\d\s-]{8,}\d)/g
const BOLD = /\*\*([^*\n]+)\*\*/g

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

/** Text and link tokens, in order. */
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

/** **bold** spans first, then links inside each span. */
export function parseInline(text: string): InlineToken[] {
  const out: InlineToken[] = []
  let last = 0
  for (const m of text.matchAll(BOLD)) {
    const start = m.index ?? 0
    if (start > last) out.push(...parseLinks(text.slice(last, start)))
    out.push(...parseLinks(m[1]).map((t) => ({ ...t, bold: true })))
    last = start + m[0].length
  }
  if (last < text.length) out.push(...parseLinks(text.slice(last)))
  return out
}

/** Paragraphs and bullet groups. Blank lines are ignored. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line === BULLET.trim() || line.startsWith(BULLET)) {
      const item = line.slice(BULLET.length - 1).trim()
      if (!item) continue
      const prev = blocks[blocks.length - 1]
      if (prev?.type === 'list') prev.items.push(item)
      else blocks.push({ type: 'list', items: [item] })
    } else blocks.push({ type: 'paragraph', text: line })
  }
  return blocks
}
