import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PRODUCTS, type Product } from '../data/products'

export type CartLine = { slug: string; qty: number }

type CartContextValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  add: (slug: string, qty?: number) => void
  setQty: (slug: string, qty: number) => void
  remove: (slug: string) => void
  productOf: (slug: string) => Product | undefined
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'lalumiere-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* private mode */
    }
  }, [lines])

  const add = useCallback((slug: string, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.slug === slug)
      if (found) {
        return prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l))
      }
      return [...prev, { slug, qty }]
    })
    setIsOpen(true)
  }, [])

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty } : l))
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug))
  }, [])

  const productOf = useCallback(
    (slug: string) => PRODUCTS.find((p) => p.slug === slug),
    []
  )

  const { count, subtotal } = useMemo(() => {
    let c = 0
    let s = 0
    for (const l of lines) {
      const p = PRODUCTS.find((x) => x.slug === l.slug)
      if (!p) continue
      c += l.qty
      s += l.qty * p.price
    }
    return { count: c, subtotal: s }
  }, [lines])

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    add,
    setQty,
    remove,
    productOf,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
