import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../hooks/useSmoothScroll'

const SECTIONS = [
  {
    number: '1',
    title: 'What Are Cookies?',
    content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or work more efficiently, as well as to provide reporting information.

Cookies set by the website owner (in this case, Eyecojic) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognise your computer both when it visits the website in question and also when it visits certain other websites.`,
  },
  {
    number: '2',
    title: 'How Eyecojic Uses Cookies',
    content: `We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve cookies through our website for advertising, analytics, and other purposes.

Essential Cookies:

These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the website, you cannot refuse them without impacting how our website functions.

Account-Related Cookies:

If you create an account with us then we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out; however in some cases they may remain afterwards to remember your site preferences when logged out.

Analytics Cookies:

We use analytics cookies to track information about how the website is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the website to see how our users react to them.`,
  },
  {
    number: '3',
    title: 'Third-Party Cookies',
    content: `In some special cases we also use cookies provided by trusted third parties. The following section details which third-party cookies you might encounter through this site.

This site uses Google Analytics, which is one of the most widespread and trusted analytics solutions on the web, helping us understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.

For more information on Google Analytics cookies, see the official Google Analytics page. We also use social media buttons and/or plugins on this site that allow you to connect with your social network in various ways. For these to work, social media sites including Facebook, Instagram, and others will set cookies through our site which may be used to enhance your profile on their site or contribute to the data they hold for various purposes outlined in their respective privacy policies.`,
  },
  {
    number: '4',
    title: 'Your Choices Regarding Cookies',
    content: `You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in our cookie consent banner.

You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information.

In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit http://www.aboutads.info/choices/ or http://www.youronlinechoices.com.`,
  },
  {
    number: '5',
    title: 'More Information About Cookies',
    content: `If you are looking for more information about cookies and how they work, the following resources may be helpful:

- AllAboutCookies.org ,  a comprehensive resource about cookies, how they work, and how you can manage them.
- Network Advertising Initiative ,  provides information on online behavioural advertising and how to opt out.
- Google Analytics ,  for details on Google's use of cookies for analytics purposes.

You can learn more about how to manage cookies in your browser by visiting the help pages of popular browsers including Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.`,
  },
  {
    number: '6',
    title: 'Changes to This Cookies Policy',
    content: `We may update this Cookies Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookies Policy regularly to stay informed about our use of cookies and related technologies.

The date at the top of this Cookies Policy indicates when it was last updated. If we make material changes to this policy, we will notify you by posting a prominent notice on our website or, where we have your contact information, by sending you a notification directly.`,
  },
  {
    number: '7',
    title: 'Contact Us',
    content: `If you have any questions about our use of cookies or other technologies, please contact us at:

Email: info@eyecojic.com

Eyecojic ,  R'Keon Life Sciences
Noida, Uttar Pradesh, India`,
  },
]

export default function CookiePolicy() {
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
            Cookie <em className="italic text-bronze">Policy.</em>
          </h1>
          <p className="legal-reveal mt-6 text-sm font-light leading-relaxed text-smoke max-w-2xl">
            This policy explains how Eyecojic uses cookies and similar tracking technologies on our website.
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
