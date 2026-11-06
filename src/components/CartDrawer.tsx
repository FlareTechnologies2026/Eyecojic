import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'

export default function CartDrawer() {
  const { lines, isOpen, closeCart, setQty, remove, productOf, subtotal, count } =
    useCart()
  const [ordered, setOrdered] = useState(false)

  useEffect(() => {
    if (!isOpen) setOrdered(false)
  }, [isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCart])

  return (
    <div
      className={`fixed inset-0 z-[70] ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-umber/40 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-umber/10 px-8 py-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-umber/70">
            Your bag {count > 0 && `· ${count}`}
          </p>
          <button
            onClick={closeCart}
            className="font-serif text-2xl leading-none text-umber/60 transition-colors hover:text-umber"
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-2xl italic text-umber/60">
                Your bag is empty.
              </p>
              <p className="mt-3 max-w-[16rem] text-xs font-light leading-relaxed text-smoke">
                Begin with the serum, or let the Discovery Ritual introduce
                you.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-umber/10">
              {lines.map((l) => {
                const p = productOf(l.slug)
                if (!p) return null
                return (
                  <li key={l.slug} className="flex gap-5 py-6">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-cream">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-lg leading-tight">
                            {p.name}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-smoke">
                            {p.size}
                          </p>
                        </div>
                        <p className="font-serif text-lg">
                          {formatPrice(p.price * l.qty)}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-umber/20">
                          <button
                            onClick={() => setQty(l.slug, l.qty - 1)}
                            className="px-3 py-1 text-sm transition-colors hover:bg-cream"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs">{l.qty}</span>
                          <button
                            onClick={() => setQty(l.slug, l.qty + 1)}
                            className="px-3 py-1 text-sm transition-colors hover:bg-cream"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => remove(l.slug)}
                          className="text-[10px] uppercase tracking-[0.25em] text-smoke underline-offset-4 transition-colors hover:text-umber hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-umber/10 px-8 py-6">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.3em] text-umber/70">
                Subtotal
              </p>
              <p className="font-serif text-2xl">{formatPrice(subtotal)}</p>
            </div>
            <p className="mb-5 text-[10px] font-light tracking-wide text-smoke">
              Complimentary shipping over ₹1,500 · careful packing with every order
            </p>
            {ordered ? (
              <p className="w-full border border-bronze/50 bg-cream py-4 text-center font-serif text-lg italic text-bronze">
                Merci, this boutique is a concept, no charge was made.
              </p>
            ) : (
              <button
                onClick={() => setOrdered(true)}
                className="w-full bg-umber py-4 text-[11px] uppercase tracking-[0.35em] text-ivory transition-colors duration-500 hover:bg-bronze"
              >
                Proceed to checkout
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
