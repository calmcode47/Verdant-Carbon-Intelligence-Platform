/**
 * @file layout.tsx
 * @description Root layout file for the Verdant application.
 * Inject global styles, sets up SEO metadata, renders the custom cursor and top navigation bar,
 * and wraps the content structure with the Radix Tooltip provider.
 */

import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { BackendHydrator } from '@/components/data/BackendHydrator';

import { TooltipProvider } from '@/components/ui/Tooltip';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Verdant — Carbon Intelligence Platform',
  description: 'Know your carbon. Own your future. AI-powered personal carbon footprint tracker.',
  keywords: ['carbon footprint', 'sustainability', 'climate', 'AI', 'green'],
  openGraph: {
    title: 'Verdant',
    description: 'Know your carbon. Own your future.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body style={{ background: '#030810' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-[#00C853] focus:px-4 focus:py-2 focus:text-black focus:font-semibold"
        >
          Skip to main content
        </a>
        <TooltipProvider delayDuration={200}>
          <BackendHydrator />
          <Navigation />
          <main id="main-content">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
