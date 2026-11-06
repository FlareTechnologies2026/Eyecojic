import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../hooks/useSmoothScroll'

const REVIEWS = [
  {
    name: 'Priya S.',
    location: 'Mumbai',
    rating: 5,
    text: 'I have been using Eyecojic for 3 weeks and the difference is visible. My dark circles have lightened and the gel feels so light on the skin.',
  },
  {
    name: 'Ananya R.',
    location: 'Bangalore',
    rating: 5,
    text: 'Non-sticky, absorbs instantly and genuinely works. I use it every morning and evening. My under-eye area looks so much brighter now.',
  },
  {
    name: 'Meera K.',
    location: 'Delhi',
    rating: 5,
    text: 'Finally a product that does what it says. Dermatologist recommended this to me and I am so glad I tried it. Worth every rupee.',
  },
  {
    name: 'Divya T.',
    location: 'Chennai',
    rating: 4,
    text: 'Gentle, effective and easy to use. The cooling texture is perfect for tired eyes. I noticed results within two weeks of daily use.',
  },
  {
    name: 'Sneha M.',
    location: 'Pune',
    rating: 5,
    text: 'The texture is absolutely beautiful ,  it melts right in. Perfect for my sensitive under-eye area and I can see a real glow difference.',
  },
  {
    name: 'Kavya L.',
    location: 'Hyderabad',
    rating: 5,
    text: 'I was skeptical at first but the results speak for themselves. Lightweight, cooling and my puffiness has reduced significantly.',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < count ? 'text-bronze' : 'text-umber/20'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Reviews() {
  const root = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.review-header', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.review-header', start: 'top 85%' },
      })

      const track = trackRef.current
      if (!track) return

      const cards = gsap.utils.toArray<HTMLElement>('.review-card')

      // horizontal scroll with pin
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth + 80),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth + 80}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        },
      })

      // skew on velocity
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth + 80}`,
        scrub: 1.2,
        onUpdate: (self) => {
          const v = self.getVelocity() / 400
          const skew = Math.min(Math.max(v, -6), 6)
          cards.forEach((card) => {
            gsap.to(card, { skewX: -skew, duration: 0.5, ease: 'power1.out', overwrite: 'auto' })
          })
        },
      })

      ScrollTrigger.refresh()
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative overflow-hidden">

      {/* header ,  outside pin so it scrolls away */}
      <div className="review-header mx-auto max-w-7xl px-6 pt-10 md:px-10 md:pt-20">
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="mb-4 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Real results </p>
          <h2 className="font-serif text-4xl font-light md:text-5xl">
            What our customers <em className="italic text-bronze">say.</em>
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <Stars count={5} />
            <p className="text-sm font-light text-smoke">4.8 · Trusted by 1 lakh+ customers</p>
          </div>
        </div>
      </div>

      {/* pinned scrolling track */}
      <div className="flex items-center overflow-hidden py-16">
        <div ref={trackRef} className="flex gap-6 px-10 will-change-transform">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="review-card w-[260px] shrink-0 bg-ivory p-8 shadow-sm will-change-transform md:w-[360px]"
            >
              <Stars count={r.rating} />
              <p className="mt-5 text-sm font-light leading-relaxed text-umber">
                "{r.text}"
              </p>
              <div className="mt-6 border-t border-umber/10 pt-4">
                <p className="text-sm font-medium text-umber">{r.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-smoke">{r.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="pb-16 text-center font-serif text-lg italic text-smoke">
        Real results. Real confidence. Real you.
      </p>

    </section>
  )
}
