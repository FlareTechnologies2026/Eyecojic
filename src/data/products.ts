export type Product = {
  slug: string
  name: string
  latin: string
  price: number
  size: string
  category: 'Serums' | 'Creams' | 'Mists' | 'Sets'
  img: string
  badge?: string
  short: string
  description: string
  notes: string[]
  ritual: string
}

export const PRODUCTS: Product[] = [
  {
    slug: 'Eyecojic-under-eye-gel',
    name: 'Eyecojic Under Eye Gel',
    latin: 'Cooling eye care · 15 g',
    price: 349,
    size: '15 g',
    category: 'Serums',
    img: '/images/product.png',
    badge: 'Original formula',
    short: 'A cooling gel that refreshes the delicate under-eye area.',
    description:
      'Eyecojic Under Eye Gel is a light, refreshing treatment made for the delicate skin around the eyes. Apply gently for a bright, rested-looking appearance without heaviness.',
    notes: ['Cooling gel texture · refreshes', 'Gentle daily care · under eyes', 'Lightweight finish · no stickiness'],
    ritual:
      'Apply a small amount beneath the eyes with the fingertip. Pat gently until absorbed and use as part of your daily eye-care routine.',
  },
  {
    slug: 'Eyecojic-daily-care',
    name: 'Eyecojic Daily Care',
    latin: 'Gentle eye-area care',
    price: 24,
    size: '15 g',
    category: 'Creams',
    img: '/images/product.png',
    short: 'A whipped seal of shea and ceramides for the final gesture.',
    description:
      'Whipped shea, phytoceramides and a whisper of the same rice ferment, churned at low temperature so the emulsion never breaks. It seals the serum beneath a breathable, velvet finish.',
    notes: ['Whipped shea · comfort', 'Phytoceramides · barrier', 'Rice ferment · continuity'],
    ritual:
      'A pearl-sized amount pressed over the serum while skin is still damp, as the evening\u2019s final gesture.',
  },
  {
    slug: 'Eyecojic-refreshing-gel',
    name: 'Eyecojic Refreshing Gel',
    latin: 'Cooling under-eye treatment',
    price: 24,
    size: '15 g',
    category: 'Mists',
    img: '/images/product.png',
    short: 'A weightless veil to wake the skin and set the ritual.',
    description:
      'Distilled rose from our own Grasse fields, folded into aloe water and a trace of glycerin. A single pass wakes the skin, prepares it for the serum, and refreshes the ritual through the day.',
    notes: ['Rose de Grasse · tone', 'Aloe water · calm', 'Vegetable glycerin · dew'],
    ritual:
      'Mist over clean skin before the serum, and again through the day whenever the light feels dry.',
  },
  {
    slug: 'Eyecojic-care-set',
    name: 'Eyecojic Care Set',
    latin: 'Under-eye gel · Everyday care',
    price: 42,
    size: '2 × 15 g',
    category: 'Sets',
    img: '/images/product.png',
    badge: 'Best value',
    short: 'A simple pair for a refreshed, cared-for eye area.',
    description:
      'Keep one Eyecojic Under Eye Gel at home and one close at hand. The easy everyday set for a fresh, comfortable eye-care ritual.',
    notes: ['Two full-size gels', 'Cooling daily ritual', 'Suitable for everyday use'],
    ritual:
      'Apply a small amount beneath each eye morning and evening. Pat gently until absorbed.'
  },
]

export const CATEGORIES = ['All', 'Serums', 'Creams', 'Mists', 'Sets'] as const

export const formatPrice = (n: number) => `₹${n.toFixed(2)}`
