import { Link } from 'react-router'

export default function Footer() {

  return (
    <footer className="bg-ivory">

      {/* main footer */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr_1fr]">

          {/* logo */}
          <div>
            <Link to="/" aria-label="Eyecojic home">
              <img
                src="/images/Eyecojic logo final.png"
                alt="Eyecojic"
                className="h-20 w-auto max-w-[180px] object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </Link>
          </div>

          {/* nav links */}
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Pages</p>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'About Us', to: '/about' },
                { label: 'Our Products', to: '/products' },
                { label: 'Contact Us', to: '/contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm font-medium text-umber transition-colors hover:text-bronze">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* buy now */}
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-umber">Buy Now</p>
            <ul className="space-y-3">
              {['Amazon', 'Myntra', 'Flipkart'].map((store) => (
                <li key={store}>
                  <a href="#" className="text-sm font-medium text-umber transition-colors hover:text-bronze">
                    {store}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* bottom bar */}
      <div className="bg-bronze px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy-policy" className="text-[11px] font-light text-ivory/80 transition-colors hover:text-ivory">Privacy Policy</Link>
            <Link to="/terms" className="text-[11px] font-light text-ivory/80 transition-colors hover:text-ivory">Terms & Conditions</Link>
            <Link to="/cookie-policy" className="text-[11px] font-light text-ivory/80 transition-colors hover:text-ivory">Cookie Policy</Link>
          </div>
          <p className="text-[11px] font-light text-ivory/80">© All Rights Reserved to Eyecojic</p>
        </div>
      </div>

    </footer>
  )
}
