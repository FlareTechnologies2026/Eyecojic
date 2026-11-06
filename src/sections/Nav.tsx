import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useCart } from '../context/CartContext'

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'Our Products', to: '/products' },
  { label: 'Contact Us', to: '/contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [showPw, setShowPw] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { count, openCart } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    if (accountOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountOpen])

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'border-b border-umber/10 bg-ivory/95 py-4 backdrop-blur-md'
            : 'bg-ivory py-7'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 md:px-10">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Eyecojic home">
            <img src="/images/Eyecojic logo final.png" alt="Eyecojic" className="h-12 w-auto object-contain lg:h-16" />
          </Link>

          <nav className="hidden items-center gap-5 lg:flex xl:gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative text-[11px] font-semibold uppercase tracking-[0.18em] text-umber transition-colors hover:text-bronze"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-bronze transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* profile icon */}
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-umber/20 transition-colors hover:border-bronze hover:text-bronze"
              aria-label="My account"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

            {/* cart */}
            <button
              onClick={openCart}
              className="relative shrink-0 border border-bronze/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] transition-all duration-500 hover:bg-bronze hover:text-ivory md:px-5 md:py-2"
            >
              Cart
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-bronze text-[10px] tracking-normal text-ivory">
                  {count}
                </span>
              )}
            </button>

            {/* hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5 text-umber" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* mobile fullscreen menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-ivory lg:hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} aria-label="Eyecojic home">
              <img src="/images/Eyecojic logo final.png" alt="Eyecojic" className="h-12 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5 text-umber" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-light uppercase tracking-[0.2em] text-umber transition-colors hover:text-bronze"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* account panel overlay */}
      {accountOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-end bg-umber/30 pt-20 backdrop-blur-sm">
          <div ref={panelRef} className="mr-6 w-full max-w-2xl rounded bg-ivory p-8 shadow-2xl md:mr-10">
            <h2 className="mb-6 font-sans text-2xl font-semibold text-umber">My account</h2>

            {/* tabs */}
            <div className="mb-6 flex gap-8 border-b border-umber/10">
              <button
                onClick={() => setTab('login')}
                className={`pb-3 text-sm font-semibold transition-colors ${tab === 'login' ? 'border-b-2 border-bronze text-bronze' : 'text-umber/50'}`}
              >
                Login
              </button>
              <button
                onClick={() => setTab('register')}
                className={`pb-3 text-sm font-semibold transition-colors ${tab === 'register' ? 'border-b-2 border-bronze text-bronze' : 'text-umber/50'}`}
              >
                Register
              </button>
            </div>

            {tab === 'login' ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* login form */}
                <form className="space-y-4 rounded border border-bronze/30 p-6">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">Username or email address *</label>
                    <input type="text" className="w-full border border-umber/20 px-3 py-2 text-sm outline-none focus:border-bronze" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">Password *</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} className="w-full border border-umber/20 px-3 py-2 text-sm outline-none focus:border-bronze" />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-smoke">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" className="accent-bronze" />
                    <label htmlFor="remember" className="text-sm text-umber/70">Remember me</label>
                  </div>
                  <button type="submit" className="bg-bronze px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ivory hover:bg-bronze">
                    Log in
                  </button>
                  <p className="text-xs">
                    <a href="#" className="text-bronze hover:underline">Lost your password?</a>
                  </p>
                </form>

                {/* register form */}
                <form className="space-y-4 rounded border border-bronze/30 p-6">
                  <h3 className="text-lg font-semibold text-umber">Register</h3>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">Email address *</label>
                    <input type="email" className="w-full border border-umber/20 px-3 py-2 text-sm outline-none focus:border-bronze" />
                  </div>
                  <p className="text-xs font-light leading-relaxed text-smoke">
                    A link to set a new password will be sent to your email address.
                  </p>
                  <p className="text-xs font-light leading-relaxed text-smoke">
                    Your personal data will be used to support your experience. See our{' '}
                    <a href="#" className="text-bronze hover:underline">privacy policy</a>.
                  </p>
                  <button type="submit" className="bg-bronze px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ivory hover:bg-bronze">
                    Register
                  </button>
                </form>
              </div>
            ) : (
              <form className="max-w-sm space-y-4 rounded border border-bronze/30 p-6">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">Email address *</label>
                  <input type="email" className="w-full border border-umber/20 px-3 py-2 text-sm outline-none focus:border-bronze" />
                </div>
                <p className="text-xs font-light leading-relaxed text-smoke">
                  A link to set a new password will be sent to your email address.
                </p>
                <button type="submit" className="bg-bronze px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ivory hover:bg-bronze">
                  Register
                </button>
              </form>
            )}

            <button onClick={() => setAccountOpen(false)} className="mt-6 text-xs text-smoke hover:text-umber">
              Close ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
