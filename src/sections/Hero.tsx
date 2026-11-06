import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap, ScrollTrigger } from '../hooks/useSmoothScroll'

export default function Hero() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-line-inner', {
        yPercent: 110,
        duration: 1.4,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.2,
      })
      gsap.from('.hero-fade', {
        autoAlpha: 0,
        y: 20,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.85,
      })
      ScrollTrigger.refresh()
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="top"
      ref={root}
      className="relative min-h-[70vh] overflow-hidden md:min-h-screen"
    >
      {/* ── FULL BG VIDEO ── */}
      <video
        src="/images/Woman_applying_under-eye_cream_1ad3a126.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-top"
      />

      {/* ── DARK OVERLAY ── */}
      <div className="absolute inset-0 bg-umber/40" />

      {/* ── CONTENT CENTERED ── */}
      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-4 pt-20 pb-12 text-center md:min-h-screen md:px-14">

        {/* eyebrow tag */}
        <p className="hero-fade mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-ivory/70">
          <span className="h-px w-10 bg-ivory/40" />
          Under-Eye Care
          <span className="h-px w-10 bg-ivory/40" />
        </p>

        {/* heading */}
        <h1 className="font-serif text-3xl font-light leading-[1.05] text-ivory md:text-6xl lg:text-7xl">
          <span className="block overflow-hidden">
            <span className="hero-line-inner block">Every glance deserves <em className="italic text-sand">a little care.</em></span>
          </span>
        </h1>

        {/* subtext */}
        <p className="hero-fade mt-6 max-w-md text-sm leading-relaxed text-ivory">
          Eyecojic Under Eye Cream reduces dark circles, brightens the under-eye area, and helps prevent fine lines.
        </p>

        {/* CTA */}
        <div className="hero-fade mt-10">
          <Link
            to="/products"
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-bronze px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-ivory transition-colors duration-500 hover:bg-bronze sm:w-auto"
          >
            Shop Now
            <span>→</span>
          </Link>
        </div>

      </div>
    </section>
  )
}
