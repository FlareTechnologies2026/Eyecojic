import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

export default function Closing() {
  const root = useRef<HTMLElement>(null)
  const [sent, setSent] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.close-line', {
        yPercent: 110,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
      gsap.from('.close-fade', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        delay: 0.3,
        scrollTrigger: { trigger: root.current, start: 'top 65%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative bg-[#535153] py-10 text-ivory md:py-14">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">

          {/* left � text */}
          <div>
            <h2 className="close-line font-serif text-4xl font-light leading-[1.05] md:text-5xl">
              Reserve your <em className="italic text-sand">first light.</em>
            </h2>
            <p className="close-fade mt-4 max-w-sm text-xs font-light leading-relaxed text-ivory/60">
              Be the first to hear about Eyecojic care, product news, and simple ways to make your daily eye ritual feel more refreshed.
            </p>
          </div>

          {/* right � newsletter form */}
          <div className="close-fade">
            <p className="mb-2 font-sans text-lg font-semibold text-ivory">Newsletter</p>
            <p className="mb-5 text-sm font-light text-ivory/60">
              Sign up to receive exclusive offers and updates.
            </p>
            {sent ? (
              <p className="font-serif text-lg italic text-sand">
                Thank you, you're on the Eyecojic list.
              </p>
            ) : (
              <form
                className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
                onSubmit={(e) => { e.preventDefault(); setSent(true) }}
              >
                <input
                  type="email"
                  required
                  placeholder="your@address.com"
                  className="flex-1 border border-ivory/20 bg-ivory/10 px-4 py-2.5 text-sm font-light placeholder:text-ivory/35 focus:outline-none focus:border-bronze"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-bronze px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ivory transition-colors hover:bg-bronze"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
