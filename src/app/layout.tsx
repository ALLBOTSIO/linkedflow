/**
 * Copyright (c) 2026 Tattoo Ideas Generator
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import type { Metadata } from 'next'
import { Inter, Creepster } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const creepster = Creepster({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-creepster',
})

export const metadata: Metadata = {
  title: 'AI Tattoo Ideas Generator - Create Unique Tattoo Designs',
  description: 'Generate unique tattoo design ideas with AI. Explore different styles, categories, and create custom tattoo art that inspires your next ink.',
  keywords: 'tattoo ideas, tattoo design, AI tattoo generator, custom tattoos, tattoo art, tattoo inspiration',
  authors: [{ name: 'Tattoo Ideas Generator' }],
  openGraph: {
    title: 'AI Tattoo Ideas Generator',
    description: 'Create unique tattoo designs with AI-powered generation',
    url: 'https://tattoo-ideas-generator.com',
    siteName: 'Tattoo Ideas Generator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Tattoo Ideas Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tattoo Ideas Generator',
    description: 'Create unique tattoo designs with AI-powered generation',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${creepster.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>

        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
          <div className="absolute inset-0 bg-[url('/tattoo-pattern.svg')] opacity-5"></div>
        </div>
      </body>
    </html>
  )
}