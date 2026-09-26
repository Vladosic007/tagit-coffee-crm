import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppBootstrap } from '@/components/layout/AppBootstrap';

export const metadata: Metadata = {
  title: 'TAGIT Coffee — Касса',
  description: 'CRM и касса кофейни на планшете',
  applicationName: 'TAGIT Coffee',
  appleWebApp: {
    capable: true,
    title: 'TAGIT',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#6F4E37',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppBootstrap>{children}</AppBootstrap>
      </body>
    </html>
  );
}
