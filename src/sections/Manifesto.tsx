import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const WORDS =
  'Rooted in a legacy of eye care since 1973, Eyecojic brings together thoughtful research and skin-loving ingredients to care for the delicate under-eye area. With a focus on quality, comfort and everyday confidence, we believe that better skincare begins with understanding what your skin truly needs.'

export default function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mword',
        { autoAlpha: 0.12 },
        {
          autoAlpha: 1,
          ease: 'none',
          stagger: 0.06,
          scrollTrigger: {
            trigger: root.current,
            start: 'top 75%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="serum" ref={root} className="relative py-12 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-10">
        <p className="mb-10 text-center text-[11px] uppercase tracking-[0.4em] text-bronze">
          Our Philosophy
        </p>
        <p className="text-balance text-center font-serif text-lg font-light leading-snug md:text-[2.9rem] md:leading-[1.25]">
          {WORDS.split(' ').map((w, i) => (
            <span key={i} className="mword inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
        <p className="mt-12 text-center font-serif text-lg italic text-smoke">
          Care, made for today.
        </p>
      </div>
    </section>
  )
}
