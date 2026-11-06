import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { gsap } from '../hooks/useSmoothScroll'
import Reviews from '../sections/Reviews'


export default function Contact() {
  const root = useRef<HTMLElement>(null)
  const [sent, setSent] = useState(false)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.contact-reveal', {
        autoAlpha: 0,
        y: 34,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
      })
      gsap.from('.contact-panel', {
        autoAlpha: 0,
        x: 50,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.35,
      })
      gsap.from('.contact-marketplace', {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-marketplace', start: 'top 85%' },
      })
    }, root)

    return () => context.revert()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <section ref={root} className="overflow-hidden pb-16 pt-28 md:pt-44 bg-ivory">
      <div className="mx-auto max-w-7xl px-4 md:px-10">

        {/* Hero */}
        <div className="mb-16">
          <p className="contact-reveal mb-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Contact Us
          </p>
          <h1 className="contact-reveal font-serif text-3xl font-light leading-[1.05] md:text-5xl lg:text-7xl text-umber">
            We'd love to <em className="italic text-bronze">hear</em> from you.
          </h1>
        </div>

        {/* Form */}
        <div className="contact-panel mb-20">
          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl shadow-sm md:grid-cols-2">

            {/* left — info panel */}
            <div className="flex flex-col justify-between bg-bronze p-10 text-ivory md:p-14">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-ivory/90">Get in touch</p>
                <h2 className="font-serif text-3xl font-light leading-snug md:text-4xl">
                  Let's talk about <em className="italic text-sand">your eyes.</em>
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-ivory">
                  Reach out for inquiries, support, or collaborations. Our team is here to help.
                </p>
              </div>
              <div className="mt-10 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory/15">
                    <svg className="h-4 w-4 text-ivory" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/80">Email</p>
                    <p className="text-sm text-ivory">info@eyecojic.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory/15">
                    <svg className="h-4 w-4 text-ivory" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/80">Phone</p>
                    <p className="text-sm text-ivory">+91-7840061316</p>
                  </div>
                </div>
              </div>
            </div>

            {/* right — form */}
            <div className="bg-ivory p-10 md:p-14">
              {sent ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bronze/10 text-2xl text-bronze">✓</div>
                  <h3 className="font-serif text-2xl font-light text-umber">Message Sent!</h3>
                  <p className="mt-3 text-sm font-light text-smoke">Your note is with our team. We'll be in touch shortly.</p>
                  <button onClick={() => setSent(false)} className="mt-8 text-[10px] uppercase tracking-[0.3em] text-bronze hover:underline">
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Your name *</label>
                      <input
                        id="name" name="name" required
                        className="w-full rounded-lg border border-umber/15 bg-[#fdf6f0] px-4 py-3 text-sm outline-none transition-colors focus:border-bronze"
                        placeholder="Priya Sharma"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Email address *</label>
                      <input
                        id="email" name="email" type="email" required
                        className="w-full rounded-lg border border-umber/15 bg-[#fdf6f0] px-4 py-3 text-sm outline-none transition-colors focus:border-bronze"
                        placeholder="priya@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Subject *</label>
                    <input
                      id="subject" name="subject" required
                      className="w-full rounded-lg border border-umber/15 bg-[#fdf6f0] px-4 py-3 text-sm outline-none transition-colors focus:border-bronze"
                      placeholder="Product enquiry"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Message</label>
                    <textarea
                      id="message" name="message" rows={4}
                      className="w-full resize-none rounded-lg border border-umber/15 bg-[#fdf6f0] px-4 py-3 text-sm outline-none transition-colors focus:border-bronze"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-bronze py-4 text-[11px] uppercase tracking-[0.35em] text-ivory transition-colors hover:bg-bronze"
                  >
                    Send Message →
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        <Reviews />

        {/* Marketplace row */}
        <div className="contact-marketplace flex flex-col items-center justify-between gap-6 border-t border-umber/10 pt-10 md:flex-row">
          <p className="text-sm font-light text-smoke">Also available on</p>
          <div className="flex flex-wrap items-center gap-6">
            {['Amazon', 'Flipkart', 'Myntra'].map((store) => (
              <span
                key={store}
                className="border border-bronze/40 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-umber transition-colors hover:bg-bronze hover:text-ivory cursor-pointer"
              >
                {store}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
