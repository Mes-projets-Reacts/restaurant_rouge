'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Utensils, ShoppingCart, Phone, X } from 'lucide-react'

export function Navbar({
  restaurantName,
  whatsappNumber,
}: {
  restaurantName: string
  whatsappNumber: string
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function handleCommanderClick(event: React.MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false)
    if (pathname === '/') {
      event.preventDefault()
      window.scrollTo(0, 0)
      window.location.reload()
    }
  }

  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">{restaurantName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              onClick={handleCommanderClick}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
            >
              Commander
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                className="hidden sm:flex items-center gap-2 text-xs font-medium text-orange-600 hover:text-orange-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div id="mobile-navigation" className="space-y-1 border-t border-gray-100 py-3 md:hidden">
            <Link
              href="/"
              onClick={handleCommanderClick}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ShoppingCart className="h-4 w-4" />
              Commander
            </Link>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-orange-700 hover:bg-orange-50"
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}