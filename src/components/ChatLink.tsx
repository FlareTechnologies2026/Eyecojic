import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { LinkKind } from '../lib/chatFormat'

// One style for every link in a Minerva reply: bold umber text at rest, no underline. On hover and keyboard
// focus the text turns rosedeep (4.9:1 on ivory; bronze and golddeep are under 4.5:1) and an underline appears.
// Underlines and rings are painted, not laid out, so nothing moves. The ring is for keyboard users only.
const cls =
  'rounded-sm font-semibold text-umber no-underline decoration-current underline-offset-4 transition-colors hover:text-rosedeep hover:underline focus:outline-none focus-visible:text-rosedeep focus-visible:underline focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-1 focus-visible:ring-offset-ivory'

export default function ChatLink({ href, kind, children }: { href: string; kind: LinkKind; children: ReactNode }) {
  // Internal routes stay in the same tab, so the conversation state survives.
  if (kind === 'internal')
    return (
      <Link to={href} className={cls}>
        {children}
      </Link>
    )
  if (kind === 'external')
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  )
}
