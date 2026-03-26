import './globals.css';
import type { ReactNode } from 'react';

import App from '../components/App';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progression Lab AI',
  description:
    'AI-assisted chord progression generator with piano and guitar visualizations. Explore harmonic ideas, voicings, and song structures instantly.',

  keywords: [
    'AI music',
    'chord progression generator',
    'music theory',
    'piano chords',
    'guitar chords',
    'songwriting tools',
    'harmony generator',
  ],

  authors: [{ name: 'Carl Welch', url: 'https://github.com/carlwelchdesign' }],

  creator: 'Carl Welch',

  openGraph: {
    title: 'Progression Lab AI',
    description: 'Generate chord progressions with AI and visualize them on piano and guitar.',
    url: 'https://progression-lab-ai.vercel.app',
    siteName: 'Progression Lab AI',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Progression Lab AI chord generator preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Progression Lab AI',
    description: 'AI-powered chord progression generator with piano and guitar visualizations.',
    images: ['/twitter-image'],
  },

  icons: {
    icon: '/brand-icon.png',
    shortcut: '/brand-icon.png',
    apple: '/brand-icon.png',
  },

  metadataBase: new URL('https://progression-lab-ai.vercel.app'),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <App>{children}</App>
      </body>
    </html>
  );
}
