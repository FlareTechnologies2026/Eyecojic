import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const PILLARS = [
  {
    title: 'Natural Ingredients',
    body: 'Enriched with natural ingredients to provide the desired results.',
  },
  {
    title: 'Non-Sticky & Light',
    body: 'Easy to apply, absorbs fast and comfortable for daily use.',
  },
  {
    title: 'No Harmful Chemicals',
    body: 'Complete natural formulation with strict purity and non-toxic.',
  },
]

export default function TrustBanner() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.trust-fade', {
        autoAlpha: 0,
        y: 24,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 82%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative overflow-hidden bg-ivory py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* ── top: heading + image side by side ── */}
        <div className="trust-fade grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">

          {/* left: heading */}
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.4em] text-bronze">Our Reach</p>
            <h2 className="font-sans text-3xl font-bold leading-tight text-umber md:text-4xl">
              Trusted by Over 1 Lakh{' '}
              <span className="text-bronze">Doctors</span>{' '}
              Across India
            </h2>
            <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-smoke">
              Eyecojic is recommended by dermatologists and eye care specialists across India for its safe, effective and gentle formulation.
            </p>
          </div>

          {/* right: trusted by image — slightly tilted */}
          <div className="flex justify-center md:justify-end">
            <img
              src="/images/trusted by.png"
              alt="Trusted by doctors"
              className="h-auto w-full max-w-xs object-contain md:max-w-sm"
              style={{ transform: 'rotate(-4deg)', transformOrigin: 'center' }}
            />
          </div>

        </div>

        {/* ── bottom: 3 pillars as horizontal cards ── */}
        <div className="trust-fade mt-8 grid grid-cols-1 gap-3 border-t border-umber/10 pt-8 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="flex items-start gap-4 rounded-xl bg-[#fdf6f0] p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze/15 font-serif text-lg font-light text-bronze">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-umber">{p.title}</p>
                <p className="mt-1 text-xs font-light leading-relaxed text-smoke">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
