import type { OptimaCrmSetting } from '@/payload-types'

export type SimilarCommercialsMode = 'include_similar' | 'only_similar' | 'exclude_similar'

export const SIMILAR_COMMERCIALS_MODES: SimilarCommercialsMode[] = [
  'include_similar',
  'only_similar',
  'exclude_similar',
]

export const DEFAULT_SIMILAR_COMMERCIALS: SimilarCommercialsMode = 'exclude_similar'

export type ResolvedOptimaCrmSettings = {
  apiUrl: string
  apiKey: string
  contactUrl: string
  userKey: string
  brochureTemplateId: string
  imageUrlWithoutResize: string
  imageUrl: string
  commercialImageBase: string
  constructionsImageBase: string
  agencyId: string
  propertyResizeBase: string
  siteId: string
  similarCommercials: SimilarCommercialsMode
}

export type OptimaImageConfig = Pick<
  ResolvedOptimaCrmSettings,
  | 'imageUrlWithoutResize'
  | 'imageUrl'
  | 'commercialImageBase'
  | 'constructionsImageBase'
  | 'agencyId'
  | 'propertyResizeBase'
  | 'siteId'
>

export const IMAGE_DEFAULTS: OptimaImageConfig = {
  imageUrlWithoutResize: 'https://images.optima-crm.com/cms_medias/',
  imageUrl: 'https://images.optima-crm.com/resize/cms_medias/',
  commercialImageBase: 'https://images.optima-crm.com/commercial_images',
  constructionsImageBase: 'https://images.optima-crm.com/constructions_images',
  agencyId: '',
  propertyResizeBase: 'https://images.optima-crm.com/resize/',
  siteId: '237',
}

export const EMPTY_OPTIMA_CRM_SETTINGS: ResolvedOptimaCrmSettings = {
  apiUrl: '',
  apiKey: '',
  contactUrl: '',
  userKey: '',
  brochureTemplateId: '39',
  ...IMAGE_DEFAULTS,
  similarCommercials: DEFAULT_SIMILAR_COMMERCIALS,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function pickBrochureTemplateId(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

function pickSimilarCommercials(
  value: unknown,
  fallback: SimilarCommercialsMode,
): SimilarCommercialsMode {
  if (
    typeof value === 'string' &&
    SIMILAR_COMMERCIALS_MODES.includes(value as SimilarCommercialsMode)
  ) {
    return value as SimilarCommercialsMode
  }
  return fallback
}

export function similarCommercialsQueryClause(
  settings: Pick<ResolvedOptimaCrmSettings, 'similarCommercials'> = EMPTY_OPTIMA_CRM_SETTINGS,
): { similar_commercials: SimilarCommercialsMode } {
  return { similar_commercials: settings.similarCommercials }
}

export function resolveOptimaCrmSettingsFromGlobal(
  doc: OptimaCrmSetting | null | undefined,
): ResolvedOptimaCrmSettings {
  const api = doc?.api
  const images = doc?.images
  const properties = doc?.properties
  const defaults = EMPTY_OPTIMA_CRM_SETTINGS
  const imageRecord = (images ?? {}) as Record<string, unknown>

  return {
    apiUrl: pickString(api?.apiUrl, defaults.apiUrl),
    apiKey: pickString(api?.apiKey, defaults.apiKey),
    contactUrl: pickString(api?.contactUrl, defaults.contactUrl),
    userKey: pickString(api?.userKey, defaults.userKey),
    brochureTemplateId: pickBrochureTemplateId(
      api?.brochureTemplateId,
      defaults.brochureTemplateId,
    ),
    imageUrlWithoutResize: pickString(
      images?.imageUrlWithoutResize,
      defaults.imageUrlWithoutResize,
    ),
    imageUrl: pickString(images?.imageUrl, defaults.imageUrl),
    commercialImageBase: pickString(images?.commercialImageBase, defaults.commercialImageBase),
    constructionsImageBase: pickString(
      imageRecord.constructionsImageBase,
      defaults.constructionsImageBase,
    ),
    agencyId: pickString(images?.agencyId, defaults.agencyId),
    propertyResizeBase: pickString(images?.propertyResizeBase, defaults.propertyResizeBase),
    siteId: pickString(images?.siteId, defaults.siteId),
    similarCommercials: pickSimilarCommercials(
      properties?.similarCommercials,
      defaults.similarCommercials,
    ),
  }
}
