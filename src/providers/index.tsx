import React from 'react'

import type { PublicIntegrationsSettings } from '@/settings/integrations/shared'
import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'

import { AppSettingsInitializer } from './AppSettings'
import { PropertyFavoritesProvider } from './PropertyFavorites'

export const Providers: React.FC<{
  children: React.ReactNode
  optimaCrmSettings: ResolvedOptimaCrmSettings
  integrationsSettings: PublicIntegrationsSettings
}> = ({ children, optimaCrmSettings, integrationsSettings }) => {
  return (
    <PropertyFavoritesProvider>
      <AppSettingsInitializer
        optimaCrmSettings={optimaCrmSettings}
        integrationsSettings={integrationsSettings}
      />
      {children}
    </PropertyFavoritesProvider>
  )
}
