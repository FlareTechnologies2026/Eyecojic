import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const FAQS = [
  {
    q: 'What does Eyecojic Under Eye Gel do?',
    a: 'Eyecojic is a light, cooling gel formulated with 2% Kojic Acid and Vitamin E to reduce the appearance of dark circles, brighten the under-eye area, and nourish the delicate skin around your eyes.',
  },
  {
    q: 'How do I use it?',
    a: 'Dot a pea-sized amount onto your ring finger and gently tap around the under-eye area from the inner to outer corner. Use morning and evening on clean skin for best results.',
  },
  {
    q: 'How soon will I see results?',
    a: 'Most customers notice a visible difference within 2 to 4 weeks of consistent daily use. For best results, use morning and night as part of your regular routine.',
  },
  {
    q: 'Is it safe for sensitive skin?',
    a: 'Yes. Eyecojic is dermatologically tested, paraben-free, vegan, and cruelty-free. The formula is designed to be gentle enough for daily use around the delicate eye area.',
  },
  {
    q: 'Can I use it under makeup?',
    a: 'Absolutely. The gel absorbs quickly and leaves no sticky residue, making it an ideal base before applying concealer or other makeup products.',
  },
  {
    q: 'Where can I buy Eyecojic?',
    a: 'Eyecojic Under Eye Gel is available on Eyecojic.com, Amazon, Flipkart, and Myntra.',
  },
]

export default function FAQ() {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.faq-header', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 80%' },
      })
      gsap.from('.faq-item', {
        autoAlpha: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.faq-list', start: 'top 82%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative bg-[#fdf6f0] py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[0.8fr_1.2fr] md:items-start">

          {/* left ,  header */}
          <div className="faq-header pt-0 md:sticky md:top-32 md:pt-8">
            <p className="mb-4 text-[11px] uppercase tracking-[0.4em] text-bronze">
              Got questions?
            </p>
            <h2 className="font-serif text-2xl font-light leading-snug md:text-5xl">
              Frequently asked <em className="italic text-bronze">questions.</em>
            </h2>
          </div>

          {/* right ,  faq list */}
          <div className="faq-list divide-y divide-umber/10 border-y border-umber/10">
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium leading-snug text-umber md:text-base">
                    {f.q}
                  </span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bronze/50 text-bronze transition-all duration-300 ${open === i ? 'rotate-180 bg-bronze text-ivory' : ''}`}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {open === i && (
                  <p className="pb-5 text-sm font-light leading-relaxed text-smoke">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
