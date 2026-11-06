import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from '../hooks/useSmoothScroll'

const PROCESS = [
  {
    n: 'I',
    title: 'Harvest',
    body: 'Each botanical is taken from a single named plot, in a single week of the year, at the hour its actives peak.',
  },
  {
    n: 'II',
    title: 'Ferment',
    body: 'Ninety days in cedar and clay. Time does what heat and solvents cannot, it softens molecules into kinship with skin.',
  },
  {
    n: 'III',
    title: 'Press',
    body: 'One cold pressing. The first and only extraction; what remains returns to the fields it came from.',
  },
  {
    n: 'IV',
    title: 'Blend',
    body: 'Actives meet at the moment each one peaks, never from stock, never from last season\u2019s vat.',
  },
  {
    n: 'V',
    title: 'Rest',
    body: 'Forty days of stillness before a single bottle ships. Formulas, like people, need time to become themselves.',
  },
]

const VALUES = [
  {
    title: 'Traceable harvests',
    body: 'Every pressing lists its plots: Jeju, Niigata, the cliffs of Plougrescant. You can stand where your serum stood.',
  },
  {
    title: 'Small pressings',
    body: 'One thousand bottles per pressing, numbered by hand. When a season is gone, it is gone.',
  },
  {
    title: 'Nothing superfluous',
    body: 'No fragrance to mask, no dye to flatter, no filler to inflate. If an ingredient cannot justify itself, it leaves.',
  },
]

export default function Maison() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.maison-line', {
        yPercent: 110,
        duration: 1.3,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.15,
      })
      gsap.from('.maison-fade', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.7,
      })
      gsap.from('.atelier-img', {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.6,
        ease: 'power4.inOut',
        scrollTrigger: { trigger: '.atelier-img', start: 'top 80%' },
      })
      gsap.to('.atelier-img img', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.atelier-img',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.from('.process-row', {
        autoAlpha: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.process-list', start: 'top 75%' },
      })
      gsap.from('.value-card', {
        autoAlpha: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.values-grid', start: 'top 80%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="pb-32 pt-36 md:pt-48">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* hero */}
        <p className="maison-fade mb-8 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> The maison
        </p>
        <h1 className="font-serif text-5xl font-light leading-[1.05] whitespace-nowrap md:text-7xl">
          Patience is the <em className="italic text-bronze">active ingredient.</em>
        </h1>
        <p className="maison-fade mt-10 max-w-lg text-sm font-light leading-relaxed tracking-wide text-smoke">
          La Lumière began in a Grasse atelier with a single question: what
          happens if a formula is given a season instead of a deadline? Twelve
          harvests later, the answer fits in four bottles.
        </p>

        {/* atelier image */}
        <div className="atelier-img relative mt-24 h-[50vh] overflow-hidden md:h-[72vh]">
          <img
            src="/images/maison-atelier.png"
            alt="The La Lumière atelier in Grasse"
            className="h-[115%] w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-umber/35 to-transparent p-8 md:p-14">
            <p className="font-serif text-xl italic text-ivory md:text-3xl">
              The atelier, Grasse, where nothing is hurried.
            </p>
          </div>
        </div>

        {/* process */}
        <div className="process-list mt-32">
          <p className="mb-14 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Five acts of slowness
          </p>
          <div className="divide-y divide-umber/10 border-y border-umber/10">
            {PROCESS.map((s) => (
              <div
                key={s.n}
                className="process-row group grid grid-cols-[auto_1fr] items-baseline gap-8 py-8 transition-colors duration-500 hover:bg-cream/60 md:grid-cols-[6rem_16rem_1fr] md:px-6"
              >
                <p className="font-serif text-3xl font-light text-linen transition-colors duration-500 group-hover:text-bronze">
                  {s.n}
                </p>
                <h2 className="font-serif text-2xl">{s.title}</h2>
                <p className="col-span-2 max-w-2xl text-sm font-light leading-relaxed text-umber md:col-span-1">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* values */}
        <div className="values-grid mt-32 grid grid-cols-1 gap-px bg-umber/10 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="value-card bg-ivory p-10 md:p-12">
              <p className="font-serif text-xl italic text-bronze">{v.title}</p>
              <p className="mt-4 text-sm font-light leading-relaxed text-umber">
                {v.body}
              </p>
            </div>
          ))}
        </div>

        {/* cta */}
        <div className="mt-32 text-center">
          <p className="font-serif text-3xl font-light italic text-umber md:text-4xl">
            “We make less, so it can be more.”
          </p>
          <Link
            to="/shop"
            className="mt-10 inline-block border border-umber/30 px-10 py-4 text-[11px] uppercase tracking-[0.35em] transition-all duration-500 hover:bg-umber hover:text-ivory"
          >
            Visit the boutique
          </Link>
        </div>
      </div>
    </section>
  )
}
