import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import About from './pages/About'
import Blogs from './pages/Blogs'
import Contact from './pages/Contact'
import CookiePolicy from './pages/CookiePolicy'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import Nav from './sections/Nav'
import Footer from './sections/Footer'
import Closing from './sections/Closing'
import CartDrawer from './components/CartDrawer'
import MinervaLauncher from './components/MinervaLauncher'
import Minerva from './pages/Minerva'
import { MinervaProvider } from './context/MinervaProvider'
import { CartProvider } from './context/CartContext'
import { useSmoothScroll, ScrollTrigger } from './hooks/useSmoothScroll'

export default function App() {
  useSmoothScroll()
  const location = useLocation()

  // route change: reset scroll, then land on hash target if present
  useEffect(() => {
    if (location.hash) {
      const t = setTimeout(() => {
        document
          .querySelector(location.hash)
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 250)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 150)
    return () => clearTimeout(t)
  }, [location.pathname])

  // /minerva is its own full-screen page: no nav, footer, cart or launcher.
  if (location.pathname === '/minerva')
    return (
      <CartProvider>
        <MinervaProvider>
          <Minerva />
        </MinervaProvider>
      </CartProvider>
    )

  return (
    <CartProvider>
      <MinervaProvider>
      <div className="grain relative">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/maison" element={<About />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Closing />
        <Footer />
        <CartDrawer />
        <MinervaLauncher />
      </div>
      </MinervaProvider>
    </CartProvider>
  )
}
