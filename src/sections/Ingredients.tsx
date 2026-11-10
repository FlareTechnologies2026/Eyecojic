import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../hooks/useSmoothScroll'

type Chapter = {
  index: string
  latin: string
  name: string
  origin: string
  story: string
  note: string
  img: string
}

const CHAPTERS: Chapter[] = [
  {
    index: '01',
    latin: 'Fungi-Sourced, Precision Depigmenting',
    name: 'Kojic Acid',
    origin: 'Antioxidant protection · Pure Fermented Derivative',
    story: 'A targeted tyrosinase inhibitor that suppresses melanin synthesis, fading dark under-eye circles and revealing a luminous gaze.',
    note: 'Visibly brightens shadow tones · Inhibits hyperpigmentation',
    img: '/images/ingredient-kojic acid.png',
  },
  {
    index: '02',
    latin: 'Tocopherol acetate',
    name: 'Advanced Vitamin E Complex',
    origin: 'Laboratory-Formulated, Targeted Hydration',
    story: 'Stabilized Vitamin E neutralizes free radical stress from screen time and environmental fatigue, repairing the delicate peri-orbital barrier.',
    note: 'Antioxidant protection · barrier repair',
    img: '/images/ingredient-vitamin E.png',
  },
]

export default function Ingredients() {
  const root = useRef<HTMLElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          onUpdate: (self) => {
            const p = self.progress
            const idx = p >= 0.5 ? 1 : 0
            if (numRef.current) {
              numRef.current.textContent = CHAPTERS[idx].index
            }
          },
        },
      })

      // only one transition: chapter 0 → chapter 1
      const at = 1.4
      tl.to(`.ing-text-0`, { autoAlpha: 0, y: -44, duration: 0.5, ease: 'power2.in' }, at)
      tl.to(`.ing-img-0`, { autoAlpha: 0, scale: 1.06, duration: 0.6, ease: 'power2.in' }, at)
      tl.fromTo(`.ing-img-1`, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, at + 0.25)
      tl.fromTo(`.ing-text-1`, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, at + 0.35)

      // gentle drift
      gsap.utils.toArray<HTMLElement>('.ing-img-inner').forEach((el) => {
        gsap.to(el, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        })
      })

      ScrollTrigger.refresh()
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="ingredients" ref={root} className="relative h-[220vh] md:h-[200vh]">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden bg-[#fdf6f0]">
        {/* header row */}
        <div className="mx-auto flex w-full max-w-7xl items-end justify-between px-6 pt-20 md:px-10 md:pt-28">
          <p className="text-[11px] uppercase tracking-[0.4em] text-bronze">
            The formula, two acts
          </p>
          <p className="font-serif text-2xl text-umber">
            <span ref={numRef}>01</span>
            <span className="text-smoke"> / 02</span>
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-6 pb-20 md:grid-cols-2 md:px-10">
          {/* text column */}
          <div className="relative order-2 h-full min-h-[24rem] md:order-1">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.index}
                className={`ing-text-${i} absolute inset-0 flex flex-col justify-center ${
                  i > 0 ? 'invisible opacity-0' : ''
                }`}
              >
                <h2 className="font-serif text-2xl font-light leading-tight md:text-5xl lg:text-6xl">
                  {c.name}
                </h2>
                <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-bronze">
                  {c.latin}
                </p>
                <ul className="mt-8 space-y-4">
                  {c.story.split('. ').filter(Boolean).slice(0, 2).map((line, j) => (
                    <li key={j} className="flex items-start gap-3 text-base font-light leading-relaxed text-umber">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                      {line.replace(/\.$/, '')}.
                    </li>
                  ))}
                </ul>
                <p className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-bronze">
                  {c.note}
                </p>
              </div>
            ))}
          </div>

          {/* image column */}
          <div className="relative order-1 h-[25vh] md:order-2 md:h-[68vh]">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.index}
                className={`ing-img-${i} absolute inset-0 overflow-hidden ${
                  i > 0 ? 'invisible opacity-0' : ''
                }`}
              >
                <div className="ing-img-inner h-[115%] w-full">
                  <img
                    src={c.img}
                    alt={c.latin}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* progress hairline */}
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 md:px-10">
          <div className="h-px w-full bg-umber/15">
            <ProgressBar rootRef={root} />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProgressBar({
  rootRef,
}: {
  rootRef: React.RefObject<HTMLElement | null>
}) {
  const barRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
        },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [rootRef])

  return (
    <div
      ref={barRef}
      className="h-px w-full origin-left scale-x-0 bg-bronze"
    />
  )
}
