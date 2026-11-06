import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const STEPS = [
  {
    n: 'I',
    title: 'Apply',
    body: 'Dot a pea-sized amount onto your ring finger for the gentlest touch.',
    img: '/images/1.png',
  },
  {
    n: 'II',
    title: 'Tap',
    body: 'Gently tap the cream around your under-eye area from the inner to outer corner.',
    img: '/images/2.png',
  },
  {
    n: 'III',
    title: 'Refresh',
    body: 'Let it absorb completely to leave your skin feeling hydrated and revived.',
    img: '/images/3.png',
  },
]

export default function Ritual() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.ritual-card', {
        autoAlpha: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: { trigger: '.ritual-grid', start: 'top 78%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="ritual" ref={root} className="relative py-12 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <p className="mb-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> The evening ritual </p>
          <h2 className="font-serif text-2xl font-light leading-tight md:text-5xl lg:text-7xl">
            Three gestures, <em className="italic text-bronze">ninety seconds.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-smoke">
            Just a few gentle touches to nourish, hydrate and leave your under-eye area looking fresh and radiant.
          </p>
        </div>

        <div className="ritual-grid grid grid-cols-1 gap-px bg-umber/10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="ritual-card group bg-ivory p-6 transition-colors duration-700 hover:bg-cream md:p-14"
            >
              <div className="mb-6 h-32 w-full overflow-hidden md:h-40">
                <img
                  src={s.img}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="font-serif text-5xl font-light text-umber/60 transition-colors duration-700 group-hover:text-bronze">
                {s.n}
              </p>
              <h3 className="mt-8 font-serif text-2xl">{s.title}</h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-umber/90">
                {s.body}
              </p>
            </div>
          ))}
        </div></div>
    </section>
  )
}
