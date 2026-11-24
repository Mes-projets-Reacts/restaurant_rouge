import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { RESTAURANT_NAME } from '@/lib/restaurant-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  applicationName: RESTAURANT_NAME,
  title: `${RESTAURANT_NAME} - Dakar`,
  description: `Commandez les menus du jour de ${RESTAURANT_NAME} à Dakar. Retrait, sur place ou livraison.`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: RESTAURANT_NAME,
  },
  openGraph: {
    title: `${RESTAURANT_NAME} - Dakar`,
    description: 'Menu du jour et commande WhatsApp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar
          restaurantName={RESTAURANT_NAME}
          whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}
        />
        <main className="min-h-screen">{children}</main>
        <Footer
          restaurantName={RESTAURANT_NAME}
          whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}
        />
      </body>
    </html>
  )
}