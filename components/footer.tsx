'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Phone, Truck, Utensils } from 'lucide-react'
import { DELIVERY_FEE } from '@/lib/restaurant-config'

export function Footer({
  restaurantName,
  whatsappNumber,
}: {
  restaurantName: string
  whatsappNumber: string
}) {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="border-t border-orange-900/20 bg-orange-950 text-orange-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-white">
            <Utensils className="h-5 w-5 text-orange-300" aria-hidden="true" />
            {restaurantName}
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-orange-100/80">
            Vos plats du jour, à emporter, sur place ou en livraison.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Informations</h2>
          <ul className="mt-3 space-y-3 text-sm text-orange-100/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-orange-300" aria-hidden="true" />
              Dakar, Sénégal
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-orange-300" aria-hidden="true" />
              Livraison : {DELIVERY_FEE.toLocaleString('fr-FR')} FCFA
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Nous contacter</h2>
          <div className="mt-3 flex flex-col items-start gap-3 text-sm">
            <Link href="/#menu" className="text-orange-100/80 transition hover:text-white">
              Commander
            </Link>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-200 transition hover:text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                +{whatsappNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-orange-100/70 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {restaurantName}. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
