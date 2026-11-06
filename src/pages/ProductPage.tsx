import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { gsap } from '../hooks/useSmoothScroll'
import { PRODUCTS, formatPrice } from '../data/products'
import { useCart } from '../context/CartContext'

const TRUST_POINTS = ['Paraben Free', 'Vegan', 'Cruelty Free', 'Natural', 'Dermatologically Tested']
const BENEFITS = [
  'Reduces appearance of dark circles',
  'Brightens and deeply nourishes the under-eye area',
  'Lightweight, soothing, and effective formula',
]

export default function ProductPage() {
  const { slug } = useParams()
  const product = PRODUCTS.find((p) => p.slug === slug)
  const root = useRef<HTMLElement>(null)
  const [qty, setQty] = useState(1)
  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [wishlisted, setWishlisted] = useState(false)
  const { add } = useCart()

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.pd-fade', {
        autoAlpha: 0,
        y: 28,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.15,
      })
      gsap.from('.pd-img', {
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: 1.5,
        ease: 'power4.inOut',
        delay: 0.1,
      })
    }, root)

    return () => context.revert()
  }, [slug])

  if (!product) return <Navigate to="/products" replace />

  const isEyecojicGel = product.slug === 'Eyecojic-under-eye-gel'
  const others = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 3)

  const checkPincode = () => {
    if (/^\d{6}$/.test(pincode)) {
      setPincodeMessage('Delivery is available to this pincode.')
      return
    }
    setPincodeMessage('Please enter a valid 6-digit pincode.')
  }

  return (
    <section ref={root} className="pb-32 pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Link
          to="/products"
          className="pd-fade mb-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-smoke transition-colors hover:text-bronze"
        >
          ← Our products
        </Link>

        {isEyecojicGel && (
          <div className="pd-fade mb-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-bronze/20 py-4 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-bronze md:justify-between">
            <span>Trusted by over 1 lakh doctors across India</span>
            <span>Original Eyecojic formula</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="pd-img relative overflow-hidden rounded-t-[8rem] bg-cream">
              <img
                src={product.img}
                alt={product.name}
                className="aspect-[4/5] w-full object-contain"
              />
              {product.badge && (
                <span className="absolute left-6 top-6 border border-bronze/40 bg-ivory/90 px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-bronze backdrop-blur-sm">
                  {product.badge}
                </span>
              )}
            </div>
            {isEyecojicGel && (
              <div className="mt-5 grid grid-cols-2 gap-px bg-umber/10 text-center sm:grid-cols-5">
                {TRUST_POINTS.map((point) => (
                  <p key={point} className="bg-ivory px-2 py-4 text-[9px] uppercase leading-relaxed tracking-[0.15em] text-umber/70">
                    {point}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="pd-fade text-[11px] uppercase tracking-[0.4em] text-bronze">
              {isEyecojicGel ? 'Featured product' : product.category}
            </p>
            <h1 className="pd-fade mt-4 max-w-2xl font-serif text-4xl font-light leading-tight md:text-6xl">
              {isEyecojicGel ? 'Eyecojic Under Eye Gel for Dark Circles' : product.name}
            </h1>
            {isEyecojicGel ? (
              <p className="pd-fade mt-4 max-w-2xl text-sm font-light leading-relaxed text-smoke">
                Eyecojic Under Eye Care for Dark Circles helps to lighten and tighten the skin under the eye and its contours. It helps to prevent fine lines, even skin tone, and boost the under-eye area.
              </p>
            ) : (
              <p className="pd-fade mt-3 font-serif text-lg italic text-smoke">{product.latin}</p>
            )}

            {isEyecojicGel ? (
              <div className="pd-fade mt-8 space-y-8">
                <div>
                  <h2 className="font-serif text-3xl font-light">Why Eyecojic?</h2>
                  <p className="mt-3 text-sm font-light leading-relaxed text-umber/80">
                    Kojic acid present in Eyecojic Under Eye Gel is a skin-brightening agent. It helps support a more even-looking appearance by helping suppress hyperpigmentation and restrain melanin formation through tyrosinase-inhibitory activity.
                  </p>
                </div>
                <div className="border-y border-umber/10 py-6">
                  <h2 className="text-[11px] uppercase tracking-[0.35em] text-bronze">Ingredients</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <p className="text-sm leading-relaxed text-umber/80"><strong className="font-medium">2% Kojic Acid</strong><br />Helps lighten dark circles and brighten the under-eye area.</p>
                    <p className="text-sm leading-relaxed text-umber/80"><strong className="font-medium">Vitamin E</strong><br />Provides antioxidant protection and nourishes the skin.</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-[11px] uppercase tracking-[0.35em] text-bronze">Key benefits</h2>
                  <ul className="mt-4 space-y-3">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3 text-sm font-light text-umber/80">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <p className="pd-fade mt-8 max-w-lg text-sm font-light leading-relaxed tracking-wide text-umber/80">{product.description}</p>
                <ul className="pd-fade mt-8 space-y-2 border-y border-umber/10 py-6">
                  {product.notes.map((note) => (
                    <li key={note} className="flex items-center gap-3 text-xs font-light tracking-wide text-umber/75"> {note}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="pd-fade mt-10 flex items-end justify-between border-t border-umber/10 pt-6">
              <div>
                <p className="font-serif text-4xl">{formatPrice(product.price)}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-smoke">Inclusive of all taxes</p>
              </div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-smoke">{product.size}</p>
            </div>

            <div className="pd-fade mt-8 flex gap-3">
              <div className="flex items-center border border-umber/25">
                <button onClick={() => setQty((current) => Math.max(1, current - 1))} className="px-4 py-3 transition-colors hover:bg-cream" aria-label="Decrease quantity">−</button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button onClick={() => setQty((current) => current + 1)} className="px-4 py-3 transition-colors hover:bg-cream" aria-label="Increase quantity">+</button>
              </div>
              <button onClick={() => add(product.slug, qty)} className="flex-1 bg-bronze py-3 text-[11px] uppercase tracking-[0.3em] text-ivory transition-colors duration-500 hover:bg-bronze">
                Add to cart · {formatPrice(product.price * qty)}
              </button>
            </div>

            {isEyecojicGel && (
              <div className="pd-fade mt-4 flex gap-3">
                <form onSubmit={(event) => { event.preventDefault(); checkPincode() }} className="flex flex-1 border border-umber/20">
                  <input value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, '').slice(0, 6)); setPincodeMessage('') }} inputMode="numeric" placeholder="Enter pincode" aria-label="Pincode" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-smoke/70" />
                  <button type="submit" className="px-4 text-[10px] uppercase tracking-[0.2em] text-bronze transition-colors hover:text-bronze">Check</button>
                </form>
                <button onClick={() => setWishlisted((current) => !current)} className={`border px-4 text-[10px] uppercase tracking-[0.2em] transition-colors ${wishlisted ? 'border-bronze bg-cream text-bronze' : 'border-umber/20 text-umber/70 hover:border-bronze hover:text-bronze'}`}>
                  {wishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
              </div>
            )}
            {pincodeMessage && <p className="mt-3 text-xs text-bronze">{pincodeMessage}</p>}

            <div className="pd-fade mt-10 divide-y divide-umber/10 border-y border-umber/10">
              {[
                ['How to use', isEyecojicGel ? 'Apply a small amount beneath each eye with your fingertip. Pat gently until absorbed. Use morning and evening as part of your daily eye-care routine.' : product.ritual],
                ['Additional information', isEyecojicGel ? 'Suitable for everyday use. For external use only. Avoid direct contact with eyes. Store in a cool, dry place away from direct sunlight.' : 'Thoughtfully made for a simple, consistent daily ritual.'],
                ['Shipping & returns', 'Orders are packed carefully and dispatched across India. Unopened products may be returned according to our returns policy.'],
              ].map(([title, body]) => (
                <details key={title} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-[0.3em] text-umber/80">
                    {title}
                    <span className="font-serif text-xl transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-lg text-xs font-light leading-relaxed text-smoke">{body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-32">
          <p className="mb-10 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Complete your eye-care ritual
          </p>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {others.map((other) => (
              <Link key={other.slug} to={`/product/${other.slug}`} className="group">
                <div className="aspect-square overflow-hidden bg-cream">
                  <img src={other.img} alt={other.name} className="h-full w-full object-contain transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <p className="font-serif text-lg transition-colors group-hover:text-bronze">{other.name}</p>
                  <p className="font-serif">{formatPrice(other.price)}</p>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-smoke">{other.size}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
