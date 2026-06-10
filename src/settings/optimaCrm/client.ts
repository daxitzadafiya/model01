import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  type OptimaImageConfig,
  type ResolvedOptimaCrmSettings,
} from '@/settings/optimaCrm/shared'

let runtimeConfig: ResolvedOptimaCrmSettings | null = null

export function invalidateOptimaCrmSettingsCache(): void {
  runtimeConfig = null
}

export function seedOptimaCrmSettings(settings: ResolvedOptimaCrmSettings): void {
  runtimeConfig = settings
}

export function getRuntimeOptimaImageConfig(): OptimaImageConfig {
  const source = runtimeConfig ?? EMPTY_OPTIMA_CRM_SETTINGS
  return {
    imageUrlWithoutResize: source.imageUrlWithoutResize,
    imageUrl: source.imageUrl,
    commercialImageBase: source.commercialImageBase,
    agencyId: source.agencyId,
    propertyResizeBase: source.propertyResizeBase,
    siteId: source.siteId,
  }
}

export function resolveOptimaCrmSettings(): ResolvedOptimaCrmSettings {
  return runtimeConfig ?? EMPTY_OPTIMA_CRM_SETTINGS
}

export type { OptimaImageConfig, ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'
