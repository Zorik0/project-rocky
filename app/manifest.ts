import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Project Hail Mary — Rocky',
    short_name: 'Rocky',
    description: 'Communicate with Rocky, the Eridian engineer.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050508',
    theme_color: '#050508',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
}
