import type { Metadata } from 'next';
import './globals.css';
import { AppBootstrap } from '@/components/layout/AppBootstrap';

export const metadata: Metadata = {
  title: 'TAGIT Coffee — Касса',
  description: 'CRM и касса кофейни на планшете',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#6F4E37" />
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
