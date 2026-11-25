import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { LinkKind } from '../lib/linkify'

// One style for every link in a Minerva reply. Text stays umber (bronze and golddeep are under 4.5:1 on ivory
// at 15px); the bronze underline, a soft bronze tint and a golddeep underline on hover/focus carry the accent.
const cls =
  'rounded-sm px-0.5 font-semibold text-umber underline decoration-bronze decoration-2 underline-offset-4 [box-decoration-break:clone] transition-colors hover:bg-bronze/15 hover:decoration-golddeep focus:outline-none focus-visible:bg-bronze/15 focus-visible:decoration-golddeep focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-1 focus-visible:ring-offset-ivory'

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
