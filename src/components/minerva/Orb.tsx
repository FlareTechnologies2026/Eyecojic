import './orb.css'

type Props = {
  /** Fill the parent (parent sets the size). */
  thinking?: boolean
  className?: string
}

// CSS-only glass orb. Size comes from the parent box so it can animate between sizes.
export default function Orb({ thinking = false, className = '' }: Props) {
  return (
    <span className={`orb ${thinking ? 'orb--thinking' : ''} ${className}`} aria-hidden="true">
      <span className="orb__swirl" />
      <span className="orb__shine" />
      <span className="orb__rim" />
    </span>
  )
}
