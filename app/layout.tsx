import type { Metadata, Viewport } from 'next';
import './globals.css';
// Self-hosted, no build-time network fetch: see ./fonts.ts.
import { fontVariables } from './fonts';

export const metadata: Metadata = {
  title: 'Planet A Foods · Workspace',
  description: 'Your Planet A workspace — launch QOaroma, paf_note, paf_feedback and more.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PAF Hub', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#320F99',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={fontVariables}>
      <head>
        {/* Set the theme before first paint (no flash of wrong theme).
            Uses stored choice, else the OS preference. Default = system. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('paf-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}",
          }}
        />
        {/* Register the service worker so the hub is installable + works offline. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
