import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const SECTIONS = [
  {
    number: '1',
    title: 'Information We Collect',
    content: `We collect information you provide directly to us when you use our website, create an account, place an order, subscribe to our newsletter, or contact us for support. This may include:

- Personal identification information such as your name, email address, phone number, and postal address.
- Payment information including credit or debit card details (processed securely through our payment partners; we do not store full card numbers).
- Order history and preferences.
- Communications you send us including customer support queries and feedback.

We also automatically collect certain information when you visit our website, including your IP address, browser type and version, pages visited, time and date of your visit, and other diagnostic data through cookies and similar technologies.`,
  },
  {
    number: '2',
    title: 'How We Use Your Information',
    content: `We use the information we collect for the following purposes:

- To process and fulfil your orders, including sending confirmation and shipping notifications.
- To create and manage your account on our platform.
- To respond to your customer service requests, queries, and complaints.
- To send you promotional communications, offers, and updates about our products ,  only where you have consented to receive such communications.
- To personalise your experience on our website and show you relevant products.
- To analyse website usage and improve our services, website functionality, and user experience.
- To comply with legal and regulatory obligations, prevent fraud, and enforce our terms.`,
  },
  {
    number: '3',
    title: 'Protection of Your Information',
    content: `We implement appropriate technical and organisational security measures to protect your personal information against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, or access. These measures include:

- Secure Socket Layer (SSL) encryption for data transmitted between your browser and our servers.
- Restricted access to personal data on a need-to-know basis among our staff and contractors.
- Regular review of our data collection, storage, and processing practices.
- Secure payment processing through PCI-DSS compliant third-party payment providers.

While we take every reasonable precaution to protect your data, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security of your information.`,
  },
  {
    number: '4',
    title: 'Sharing Your Information',
    content: `We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except as described in this policy:

- Service Providers: We share information with trusted third parties who assist us in operating our website, conducting our business, or servicing you (e.g., shipping carriers, payment processors, email marketing platforms). These parties are contractually obligated to keep your information confidential and use it only for the purposes we specify.
- Legal Requirements: We may disclose your information when required to do so by law, court order, or governmental authority, or when we believe in good faith that such disclosure is necessary to protect our rights, your safety, or the safety of others.
- Business Transfers: In the event of a merger, acquisition, or sale of all or part of our assets, your personal information may be transferred to the acquiring entity.`,
  },
  {
    number: '5',
    title: 'Third-party Services and Links',
    content: `Our website may contain links to third-party websites, including our marketplace partners such as Amazon, Flipkart, and Myntra. Please be aware that we have no control over the content or privacy practices of these external sites and we are not responsible for their privacy policies.

We encourage you to review the privacy policy of any third-party site you visit. Clicking on third-party links will redirect you away from our website, and any information you provide on those sites is subject to their respective privacy policies, not ours.

We may also use third-party analytics and advertising services that may collect information about your use of our website and other websites over time.`,
  },
  {
    number: '6',
    title: 'Cookies',
    content: `Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyse site traffic, and understand where our visitors come from. Cookies are small data files placed on your device that help us remember your preferences and improve our services.

You can control cookie settings through your browser preferences. Please note that disabling certain cookies may affect the functionality of our website. For detailed information about the cookies we use, please refer to our Cookie Policy.`,
  },
  {
    number: '7',
    title: "Children's Privacy",
    content: `Our website and services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately at info@eyecojic.com.

If we become aware that we have inadvertently collected personal information from a child under the age of 13, we will take steps to delete such information from our records promptly. We encourage parents and guardians to monitor their children's online activity and to help enforce this policy by instructing their children never to provide personal information through our website without parental consent.`,
  },
  {
    number: '8',
    title: 'Your Rights',
    content: `Depending on your location and applicable laws, you may have certain rights regarding your personal information, including:

- The right to access the personal information we hold about you.
- The right to request correction of inaccurate or incomplete information.
- The right to request deletion of your personal information, subject to certain exceptions.
- The right to object to or restrict certain types of processing.
- The right to data portability ,  to receive your information in a structured, commonly used, machine-readable format.
- The right to withdraw consent at any time where processing is based on consent.

To exercise any of these rights, please contact us at info@eyecojic.com. We will respond to your request within a reasonable timeframe and in accordance with applicable laws.`,
  },
  {
    number: '9',
    title: 'Changes to This Privacy Policy',
    content: `We reserve the right to update or modify this Privacy Policy at any time. When we make changes, we will update the effective date at the top of this page and, where appropriate, notify you by email or through a prominent notice on our website.

We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of our website and services after any changes to this policy constitutes your acceptance of the revised policy.`,
  },
  {
    number: '10',
    title: 'Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out to us:

Email: info@eyecojic.com

Eyecojic ,  R'Keon Life Sciences
Noida, Uttar Pradesh, India

We are committed to resolving any complaints or concerns about your privacy in a fair and timely manner.`,
  },
]

export default function PrivacyPolicy() {
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
            Privacy <em className="italic text-bronze">Policy.</em>
          </h1>
          <p className="legal-reveal mt-6 text-sm font-light leading-relaxed text-smoke max-w-2xl">
            Your privacy matters to us. This policy explains how Eyecojic collects, uses, and protects your personal information.
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
