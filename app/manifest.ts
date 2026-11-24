import type { MetadataRoute } from 'next'
import { RESTAURANT_NAME } from '@/lib/restaurant-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: RESTAURANT_NAME,
    short_name: RESTAURANT_NAME,
    description: `Menu du jour et commande chez ${RESTAURANT_NAME}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7ed',
    theme_color: '#c2410c',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
