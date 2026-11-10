import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { gsap } from '../hooks/useSmoothScroll'
import Orb from './eyco/Orb'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Floating orb on the main site. A real link to /eyco, below the nav menu and cart (z-60/70).
export default function EycoLauncher() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  if (pathname === '/eyco') return null

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab clicks and reduced-motion users.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || reducedMotion()) return
    e.preventDefault()
    const orb = e.currentTarget.querySelector('.eyco-orb-box')
    if (!orb) return navigate('/eyco')
    const r = orb.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))

    // Ivory circle grows from the orb until it fills the screen, then fades out on the new page.
    const veil = document.createElement('div')
    Object.assign(veil.style, {
      position: 'fixed',
      left: `${cx - radius}px`,
      top: `${cy - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      background: '#F5F0E8',
      zIndex: '9999',
      pointerEvents: 'none',
      transform: `scale(${r.width / 2 / radius})`,
    })
    document.body.appendChild(veil)

    // Runs once, from the animation or from the timer if the tab is throttled or hidden,
    // so the route always changes and the veil never lingers.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      navigate('/eyco')
      gsap.to(veil, { autoAlpha: 0, duration: 0.3, delay: 0.1, onComplete: () => veil.remove() })
      window.setTimeout(() => veil.remove(), 1500)
    }
    gsap.to(veil, { scale: 1, duration: 0.45, ease: 'power2.in', onComplete: finish })
    window.setTimeout(finish, 900)
  }

  return (
    <Link
      to="/eyco"
      onClick={onClick}
      aria-label="Chat with Eyco"
      className="fixed bottom-4 right-4 z-[55] flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-umber focus-visible:ring-offset-2 md:bottom-6 md:right-6"
    >
      <span className="hidden rounded-full border border-umber/10 bg-ivory/95 px-4 py-2 text-left shadow-md backdrop-blur-sm sm:block">
        <span className="block text-sm font-medium leading-tight text-umber">Ask Eyco</span>
        <span className="block text-[11px] leading-tight text-umber/75">Usage, ingredients &amp; delivery</span>
      </span>
      <span className="eyco-orb-box block h-14 w-14 md:h-16 md:w-16">
        <Orb />
      </span>
    </Link>
  )
}
