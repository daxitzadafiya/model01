import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Outfit, EB_Garamond } from 'next/font/google'
import React from 'react'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
})

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { getActiveLocale } from '@/i18n/getLanguageMenu'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const { locale } = await getActiveLocale()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable, outfit.variable, ebGaramond.variable)} lang={locale} suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Inject dynamic CSS variables from Payload Theme global */}
        <ThemeColors />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}

async function ThemeColors() {
  const payload = await getPayload({ config: configPromise })
  let colors = null

  try {
    const theme = await payload.findGlobal({
      slug: 'theme',
      depth: 0,
    })
    colors = theme?.colors
  } catch (error) {
    console.error('Error fetching Theme global:', error)
  }

  if (!colors) return null

  const css = `
    :root {
      --color-primary: ${colors.primary || '#000000'};
      --color-secondary: ${colors.secondary || '#5e5e5c'};
      --color-tertiary: ${colors.tertiary || '#755b00'};
      --color-surface: ${colors.surface || '#fef9f1'};
      --color-background: ${colors.background || '#fef9f1'};
    }
  `

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
