import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { gsap } from '../hooks/useSmoothScroll'
import Reviews from '../sections/Reviews'

const VALUES: { title: string; img: string | null; icon?: string; body: string }[] = [
  {
    title: 'Natural Ingredients',
    img: null,
    body: 'Enriched with all-natural ingredients like kojic acid and vitamin E for visible, proven results.',
  },
  {
    title: 'Science-Backed',
    img: null,
    body: 'Formulated after intensive R&D with a team of specialists and scientists dealing with eye issues.',
  },
  {
    title: 'Trusted Since 1973',
    img: null,
    body: 'RLS has been a trusted name in ophthalmic care for over 50 years, committed to quality and affordability.',
  },
]


export default function About() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.about-reveal', {
        autoAlpha: 0,
        y: 32,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
      })
      gsap.from('.about-value', {
        autoAlpha: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.about-values', start: 'top 78%' },
      })
      gsap.from('.about-review', {
        autoAlpha: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.about-reviews', start: 'top 80%' },
      })
    }, root)
    return () => context.revert()
  }, [])

  return (
    <section ref={root} className="overflow-hidden bg-ivory pb-20 pt-36 md:pt-44">
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* ── HERO ── */}
        <div className="about-reveal mb-20 grid items-center gap-10 grid-cols-1 md:grid-cols-2 md:gap-20">
          <div>
            <p className="mb-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> About Eyecojic
            </p>
            <h1 className="font-serif text-4xl font-light leading-[1.05] text-umber md:text-5xl lg:text-6xl">
              Care that <em className="italic text-bronze">wakes</em> you up.
            </h1>
            <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-smoke">
              Eyecojic brings a fresh point of view to everyday eye care — simple formulas, a cooling touch, and a ritual that fits real life.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-bronze px-8 py-3 text-[11px] uppercase tracking-[0.3em] text-ivory transition-colors hover:bg-bronze"
            >
              Explore Products →
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-cream">
            <img
              src="/images/about.png"
              alt="Eyecojic Under Eye Gel"
              className="h-56 w-full object-contain p-8 md:h-96"
            />
          </div>
        </div>

        {/* ── WELCOME ── */}
        <div className="about-reveal mb-16 grid gap-10 border-t border-umber/10 pt-16 md:grid-cols-2 md:gap-20">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-bronze">Welcome to Eyecojic</p>
            <h2 className="font-serif text-3xl font-light leading-snug text-umber md:text-4xl">
              The science of <em className="italic text-bronze">beautiful eyes.</em>
            </h2>
          </div>
          <p className="text-sm font-light leading-relaxed text-smoke self-center">
            Eyecojic under eye care is from the house of R'Keon Life Sciences. Formulated after intensive research and development with a team of specialists and scientists, Eyecojic contains all-natural ingredients like kojic acid and Vitamin E. Our products deliver all the performance but none of the toxins — working with your under-eye skin to provide visible, proven, beautiful results for dark circles.
          </p>
        </div>

        {/* ── VALUES CARDS ── */}
        <div className="about-values mb-16 grid gap-6 grid-cols-1 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="about-value rounded-xl border border-umber/10 bg-[#fdf6f0] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bronze/10 font-serif text-xl font-light text-bronze">
                {String(VALUES.indexOf(v) + 1).padStart(2, '0')}
              </div>
              <p className="mt-4 font-sans text-lg font-semibold text-umber">{v.title}</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-smoke">{v.body}</p>
            </div>
          ))}
        </div>

        {/* ── ABOUT RLS ── */}
        <div className="about-reveal mb-16 grid gap-10 border-t border-umber/10 pt-16 grid-cols-1 md:grid-cols-2 md:gap-20">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-bronze">About Us</p>
            <h2 className="font-serif text-3xl font-light leading-snug text-umber md:text-4xl">
              A legacy of <em className="italic text-bronze">eye care.</em>
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[['1973', 'Founded'], ['250+', 'Employees'], ['Pan-India', 'Presence'], ['2 Offices', 'Prayagraj & Noida']].map(([stat, label]) => (
                <div key={label} className="rounded-lg bg-cream p-5 text-center">
                  <p className="font-serif text-2xl font-light text-bronze">{stat}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-smoke">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="self-center space-y-4">
            <p className="text-sm font-light leading-relaxed text-smoke">
              RLS is a trusted indigenous name in the ophthalmic industry of India, committed to preserving and restoring the health of millions through high quality, accessible and affordable products. Started in 1973, RLS has a strong pan-India presence with more than 250 employees, with its Head Office in Prayagraj and Corporate Office in Noida, Uttar Pradesh.
            </p>
            <p className="text-sm font-light leading-relaxed text-smoke">
              We are an ambitious and fast-growing ophthalmology player commercializing a wide portfolio of products. Our promise is to deliver high-quality products and spread innovation and advancement towards better eye health. RLS fosters a unique network enabling ophthalmologists at clinics, hospitals and medical centres to provide patients with the highest quality of eye care.
            </p>
          </div>
        </div>

        {/* ── REVIEWS ── */}
        <Reviews />

      </div>
    </section>
  )
}
