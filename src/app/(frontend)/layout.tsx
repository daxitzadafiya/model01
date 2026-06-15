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

import { CookieConsent } from '@/components/CookieConsent'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import './globals.css'
import { getFaviconSource } from '@/components/Logo/getLogoSources'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPublicIntegrationsSettings } from '@/settings/integrations/server'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { resolveThemeCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getActiveLocale()
  const logoData = await getCachedGlobal('logo', 1)()
  const favicon = getFaviconSource(logoData)
  const [optimaCrmSettings, integrationsSettings] = await Promise.all([
    getOptimaCrmSettings(),
    getPublicIntegrationsSettings(),
  ])

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable, outfit.variable, ebGaramond.variable)} lang={locale} suppressHydrationWarning>
      <head>
        <meta content="light" name="color-scheme" />
        <link href={favicon} rel="icon" sizes="any" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Site-wide CSS variables from Theme global (falls back to default palette) */}
        <ThemeStyles />
      </head>
      <body>
        <Providers
          optimaCrmSettings={optimaCrmSettings}
          integrationsSettings={integrationsSettings}
        >
          <Header />
          {children}
          <Footer />
          <CookieConsent />
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

async function ThemeStyles() {
  const payload = await getPayload({ config: configPromise })
  let customCSS: string | null = null

  try {
    const theme = await payload.findGlobal({
      slug: 'theme',
      depth: 0,
    })
    customCSS = theme.customCSS ?? null
  } catch (error) {
    console.error('Error fetching Theme global:', error)
  }

  return <style dangerouslySetInnerHTML={{ __html: resolveThemeCustomCSS(customCSS) }} />
}
