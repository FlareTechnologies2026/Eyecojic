import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gsap } from '../hooks/useSmoothScroll'
import { PRODUCTS, formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'
import Reviews from '../sections/Reviews'


const FAQS = [
  { q: 'Where can I buy Eyecojic?', a: 'Eyecojic is available on Eyecojic.com, Amazon, Flipkart, and Myntra.' },
  { q: 'How do I know if the product I buy on Amazon is authentic?', a: 'Always purchase from the official Eyecojic store listed on Amazon, Flipkart or Myntra. Look for the verified seller badge.' },
  { q: 'How did the Eyecojic brand begin?', a: 'Eyecojic was created by R\'Keon Life Sciences (RLS), a trusted name in ophthalmic care since 1973, as part of their expansion into allied eye-related skincare products.' },
  { q: 'What is the best treatment for under eye dark circles?', a: 'Consistent use of Eyecojic Under Eye Gel with 2% Kojic Acid and Vitamin E, applied morning and evening, is an effective and gentle daily treatment for dark circles.' },
]

export default function Shop() {
  const root = useRef<HTMLElement>(null)
  const { add } = useCart()
  const featured = PRODUCTS.find(p => p.slug === 'Eyecojic-under-eye-gel')!
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.shop-fade', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.2,
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="pb-16 pt-28 md:pt-44">
      <div className="mx-auto max-w-7xl px-4 md:px-10">

        {/* header */}
        <div className="shop-fade mb-12">
          <p className="mb-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Our Products
          </p>
          <h1 className="font-serif text-2xl font-light leading-[1.05] md:text-4xl lg:text-6xl">
            Trusted by Over 1 Lakh <em className="italic text-bronze">Doctors</em> Across India
          </h1>
        </div>

        {/* featured product */}
        <div className="shop-fade grid grid-cols-1 gap-12 border-t border-umber/10 pt-12 lg:grid-cols-2 lg:gap-20">

          {/* image */}
          <div className="flex items-center justify-center rounded bg-cream p-10">
            <img
              src={featured.img}
              alt={featured.name}
              className="h-auto w-full max-w-sm object-contain"
            />
          </div>

          {/* info */}
          <div className="flex flex-col justify-center">
            <span className="mb-3 inline-block border border-bronze/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-bronze">Featured Product</span>
            <h2 className="font-serif text-3xl font-light leading-snug text-umber md:text-4xl">
              Eyecojic Under Eye Gel for Reducing Dark Circles With 2% Kojic Acid
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-bronze">Product Highlights</p>
                <p className="text-sm font-light leading-relaxed text-smoke">
                  Specially formulated to reduce dark circles and nourish the delicate skin under your eyes. It brightens the under-eye area, improves skin tone, and helps minimize fine lines ,  leaving your skin looking fresh, smooth and revitalized.
                </p>
              </div>

              <div className="border-t border-umber/10 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-bronze">Ingredients</p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2 text-sm font-light text-smoke">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                    <span><strong className="font-medium text-umber">2% Kojic Acid</strong>  to  Helps lighten dark circles and brighten the under-eye area</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm font-light text-smoke">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                    <span><strong className="font-medium text-umber">Vitamin E</strong>  to  Provides antioxidant protection and nourishes the skin</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-umber/10 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-bronze">Key Benefits</p>
                <ul className="space-y-1">
                  {['Reduces appearance of dark circles', 'Brightens and deeply nourishes the under-eye area', 'Lightweight, soothing, and effective formula'].map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm font-light text-smoke">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between border-t border-umber/10 pt-6">
              <p className="font-serif text-4xl text-umber">{formatPrice(featured.price)}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-smoke">{featured.size}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => add(featured.slug)}
                className="flex-1 bg-bronze py-3 text-[11px] uppercase tracking-[0.3em] text-ivory transition-colors hover:bg-bronze"
              >
                Add to Cart
              </button>
              <Link
                to={`/product/${featured.slug}`}
                className="flex-1 border border-umber/30 px-6 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-umber transition-colors hover:border-bronze hover:text-bronze"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>

        {/* reviews */}
        <Reviews />

        {/* marketplace */}
        <div className="mt-16 flex flex-col items-center gap-4 border border-umber/10 p-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-sans text-base font-semibold text-umber">Also available on</p>
            <p className="mt-1 text-sm font-light text-smoke">Get Eyecojic easily from your preferred online shopping platform.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['Amazon', 'Flipkart', 'Myntra'].map(s => (
              <a key={s} href="#" className="border border-umber/20 px-6 py-2.5 text-sm font-medium text-umber transition-colors hover:border-bronze hover:text-bronze">
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t border-umber/10 pt-12">
          <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-bronze">Frequently Asked Questions</p>
          <h2 className="mb-8 font-serif text-3xl font-light">Questions answered <em className="italic text-bronze">clearly.</em></h2>
          <div className="divide-y divide-umber/10 border-y border-umber/10">
            {FAQS.map((f, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-umber">{f.q}</span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bronze/50 text-bronze transition-all duration-300 ${openFaq === i ? 'rotate-180 bg-bronze text-ivory' : ''}`}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {openFaq === i && <p className="pb-5 text-sm font-light leading-relaxed text-smoke">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
