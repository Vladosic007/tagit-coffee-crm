import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TAGIT Coffee — Касса',
    short_name: 'TAGIT',
    description: 'Касса и учётная система кофейни',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#F7F3EE',
    theme_color: '#6F4E37',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
