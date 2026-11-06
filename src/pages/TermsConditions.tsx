import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const SECTIONS = [
  {
    number: '1',
    title: 'Use of This Website',
    content: `By accessing and using the Eyecojic website (eyecojic.com), you accept and agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our website.

You agree to use our website only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website. Prohibited behaviour includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our website.

We reserve the right to modify these Terms & Conditions at any time. Continued use of the website following any changes constitutes your acceptance of the revised terms. You are responsible for regularly reviewing these terms to stay informed of any updates.`,
  },
  {
    number: '2',
    title: 'Ordering and Payments',
    content: `When you place an order through our website or any of our authorised marketplace partners (Amazon, Flipkart, Myntra), you are making an offer to purchase the selected product(s) at the listed price. All orders are subject to acceptance and availability.

We reserve the right to refuse or cancel any order at our sole discretion, including orders that appear to be placed by dealers, resellers, or distributors, or orders placed in quantities that exceed reasonable personal use.

Prices listed on our website are in Indian Rupees (INR) and are inclusive of applicable GST unless otherwise stated. We reserve the right to change prices at any time without prior notice, but any change will not affect orders that have already been confirmed.

Payment must be made at the time of placing your order. We accept all major credit and debit cards, UPI, net banking, and other payment methods as displayed at checkout. All transactions are processed securely through our payment partners.`,
  },
  {
    number: '3',
    title: 'Shipping and Delivery',
    content: `We aim to dispatch all orders within 2 to 3 business days of order confirmation. Estimated delivery times vary by location and are typically 5 to 7 business days for standard shipping within India.

Delivery timelines are estimates and not guarantees. Delays may occur due to unforeseen circumstances including courier issues, public holidays, natural events, or other factors beyond our control. We are not liable for any loss or damage resulting from delivery delays.

Shipping charges, if applicable, will be displayed at checkout before you confirm your order. We offer free shipping on orders above a certain value, which may change from time to time and will be communicated on the website.

Risk of loss and title for all products pass to you upon delivery to the shipping address you provided.`,
  },
  {
    number: '4',
    title: 'Returns and Refunds',
    content: `We want you to be completely satisfied with your purchase. If you are not satisfied for any reason, you may return eligible products within 7 days of delivery, subject to the following conditions:

- The product must be unused, unopened, and in its original packaging.
- You must provide proof of purchase (order confirmation or invoice).
- Products purchased through marketplace partners (Amazon, Flipkart, Myntra) must be returned through their respective return policies.

To initiate a return for orders placed directly through our website, please contact us at info@eyecojic.com with your order details and reason for return. Once we receive and inspect the returned product, we will process a refund to your original payment method within 7 to 10 business days.

We reserve the right to refuse returns that do not meet the above conditions. Shipping costs for returns are the responsibility of the customer unless the return is due to our error or a defective product.`,
  },
  {
    number: '5',
    title: 'Intellectual Property',
    content: `All content on this website ,  including but not limited to text, graphics, logos, images, product descriptions, icons, and software ,  is the property of Eyecojic / R'Keon Life Sciences and is protected by applicable Indian and international intellectual property laws.

You are granted a limited, non-exclusive, non-transferable licence to access and use this website for personal, non-commercial purposes only. You may not reproduce, distribute, display, transmit, adapt, or create derivative works from any content on this website without our express written permission.

The Eyecojic name, logo, and all related product names, design marks, and slogans are trademarks of R'Keon Life Sciences. Unauthorised use of any trademark is strictly prohibited and may result in legal action.`,
  },
  {
    number: '6',
    title: 'Product Descriptions and Disclaimers',
    content: `We make every effort to ensure that product descriptions, images, and information on our website are accurate and up to date. However, we do not warrant that product descriptions or other content on this site are complete, accurate, reliable, current, or error-free.

Eyecojic products are cosmetic skin-care products and are not intended to diagnose, treat, cure, or prevent any disease or medical condition. Individual results may vary. We recommend performing a patch test before using any new skin-care product. If you have sensitive skin or any known allergies, consult a dermatologist before use.

We are not liable for any allergic reactions or adverse effects resulting from the use of our products when used contrary to the instructions provided on the packaging or our website.`,
  },
  {
    number: '7',
    title: 'Limitation of Liability',
    content: `To the fullest extent permitted by applicable law, Eyecojic and R'Keon Life Sciences shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of this website or our products, even if we have been advised of the possibility of such damages.

Our total liability to you for any claim arising from your use of the website or purchase of our products shall not exceed the amount you paid for the product(s) giving rise to the claim.

Nothing in these Terms & Conditions shall limit or exclude our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be limited or excluded by applicable law.`,
  },
  {
    number: '8',
    title: 'Governing Law',
    content: `These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Noida, Uttar Pradesh, India.

If any provision of these Terms & Conditions is found to be invalid or unenforceable by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.`,
  },
  {
    number: '9',
    title: 'Contact Us',
    content: `If you have any questions or concerns about these Terms & Conditions, please contact us:

Email: info@eyecojic.com

Eyecojic ,  R'Keon Life Sciences
Noida, Uttar Pradesh, India

We are committed to addressing your queries promptly and ensuring a transparent and trustworthy experience.`,
  },
]

export default function TermsConditions() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.legal-reveal', {
        autoAlpha: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
      })
      gsap.from('.legal-section', {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.legal-content', start: 'top 80%' },
      })
    }, root)
    return () => context.revert()
  }, [])

  return (
    <section ref={root} className="bg-ivory pb-20 pt-36 md:pt-44">
      <div className="max-w-4xl mx-auto px-6 md:px-10">

        {/* Hero */}
        <div className="mb-16">
          <p className="legal-reveal mb-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-bronze"> Legal
          </p>
          <h1 className="legal-reveal font-serif text-5xl font-light leading-[1.05] text-umber md:text-6xl">
            Terms &amp; <em className="italic text-bronze">Conditions.</em>
          </h1>
          <p className="legal-reveal mt-6 text-sm font-light leading-relaxed text-smoke max-w-2xl">
            Please read these Terms &amp; Conditions carefully before using our website or purchasing our products. By accessing our site, you agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        <div className="legal-content space-y-0 border-t border-umber/10 pt-12">
          {SECTIONS.map((s) => (
            <div key={s.number} className="legal-section mb-12">
              <div className="flex items-start gap-6">
                <span className="font-serif text-5xl font-light text-bronze leading-none shrink-0">{s.number}</span>
                <div className="flex-1">
                  <h2 className="font-sans text-2xl font-bold text-umber leading-snug">{s.title}</h2>
                  <div className="mt-4 space-y-3">
                    {s.content.split('\n\n').map((block, bi) => {
                      const lines = block.split('\n')
                      const isBulletBlock = lines.some(l => l.trim().startsWith('- '))
                      if (isBulletBlock) {
                        return (
                          <ul key={bi} className="list-disc list-outside ml-5 space-y-2">
                            {lines.filter(l => l.trim().startsWith('- ')).map((l, li) => (
                              <li key={li} className="text-sm font-light leading-relaxed text-smoke">{l.trim().replace(/^- /, '')}</li>
                            ))}
                          </ul>
                        )
                      }
                      const trimmed = block.trim()
                      if (trimmed.endsWith(':') && trimmed.split('\n').length === 1 && trimmed.length < 80) {
                        return <p key={bi} className="font-semibold text-umber mt-4 mb-1">{trimmed}</p>
                      }
                      return <p key={bi} className="text-sm font-light leading-relaxed text-smoke">{trimmed}</p>
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
