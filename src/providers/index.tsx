import React from 'react'

import type { Locale } from '@/i18n/config'
import type { PublicIntegrationsSettings } from '@/settings/integrations/shared'
import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'

import { AppSettingsInitializer } from './AppSettings'
import { HeroOverlayProvider } from './HeroOverlay'
import { PropertyFavoritesProvider } from './PropertyFavorites'
import { SiteLocaleProvider } from './SiteLocale'

export const Providers: React.FC<{
  children: React.ReactNode
  locale: Locale
  optimaCrmSettings: ResolvedOptimaCrmSettings
  integrationsSettings: PublicIntegrationsSettings
}> = ({ children, locale, optimaCrmSettings, integrationsSettings }) => {
  return (
    <SiteLocaleProvider initialLocale={locale}>
      <PropertyFavoritesProvider>
        <HeroOverlayProvider>
          <AppSettingsInitializer
            optimaCrmSettings={optimaCrmSettings}
            integrationsSettings={integrationsSettings}
          />
          {children}
        </HeroOverlayProvider>
      </PropertyFavoritesProvider>
    </SiteLocaleProvider>
  )
}
