import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  similarCommercialsQueryClause,
  type OptimaImageConfig,
  type PropertyReferenceField,
  type ProjectReferenceField,
  type ResolvedOptimaCrmSettings,
  type SimilarCommercialsMode,
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
    constructionsImageBase: source.constructionsImageBase,
    agencyId: source.agencyId,
    propertyResizeBase: source.propertyResizeBase,
    siteId: source.siteId,
  }
}

export function resolveOptimaCrmSettings(): ResolvedOptimaCrmSettings {
  return runtimeConfig ?? EMPTY_OPTIMA_CRM_SETTINGS
}

export function getSimilarCommercialsQuery(): { similar_commercials: SimilarCommercialsMode } {
  return similarCommercialsQueryClause(resolveOptimaCrmSettings())
}

export function getPropertyReferenceField(): PropertyReferenceField {
  return resolveOptimaCrmSettings().propertyReferenceField
}

export function getProjectReferenceField(): ProjectReferenceField {
  return resolveOptimaCrmSettings().projectReferenceField
}

export type {
  OptimaImageConfig,
  PropertyReferenceField,
  ProjectReferenceField,
  ResolvedOptimaCrmSettings,
  SimilarCommercialsMode,
} from '@/settings/optimaCrm/shared'

export {
  getShownReference,
  resolvePropertyDisplayReference,
  resolveProjectDisplayReference,
} from '@/settings/optimaCrm/shared'
