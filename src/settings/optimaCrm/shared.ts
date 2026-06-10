import type { OptimaCrmSetting } from '@/payload-types'

export type ResolvedOptimaCrmSettings = {
  apiUrl: string
  apiKey: string
  contactUrl: string
  userKey: string
  brochureTemplateId: string
  imageUrlWithoutResize: string
  imageUrl: string
  commercialImageBase: string
  agencyId: string
  propertyResizeBase: string
  siteId: string
}

export type OptimaImageConfig = Pick<
  ResolvedOptimaCrmSettings,
  | 'imageUrlWithoutResize'
  | 'imageUrl'
  | 'commercialImageBase'
  | 'agencyId'
  | 'propertyResizeBase'
  | 'siteId'
>

export const IMAGE_DEFAULTS: OptimaImageConfig = {
  imageUrlWithoutResize: 'https://images.optima-crm.com/cms_medias/',
  imageUrl: 'https://images.optima-crm.com/resize/cms_medias/',
  commercialImageBase: 'https://images.optima-crm.com/commercial_images',
  agencyId: '',
  propertyResizeBase: 'https://images.optima-crm.com/resize/commercial_images/',
  siteId: '237',
}

export const EMPTY_OPTIMA_CRM_SETTINGS: ResolvedOptimaCrmSettings = {
  apiUrl: '',
  apiKey: '',
  contactUrl: '',
  userKey: '',
  brochureTemplateId: '39',
  ...IMAGE_DEFAULTS,
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

export function resolveOptimaCrmSettingsFromGlobal(
  doc: OptimaCrmSetting | null | undefined,
): ResolvedOptimaCrmSettings {
  const api = doc?.api
  const images = doc?.images
  const defaults = EMPTY_OPTIMA_CRM_SETTINGS

  return {
    apiUrl: pickString(api?.apiUrl, defaults.apiUrl),
    apiKey: pickString(api?.apiKey, defaults.apiKey),
    contactUrl: pickString(api?.contactUrl, defaults.contactUrl),
    userKey: pickString(api?.userKey, defaults.userKey),
    brochureTemplateId: pickBrochureTemplateId(api?.brochureTemplateId, defaults.brochureTemplateId),
    imageUrlWithoutResize: pickString(images?.imageUrlWithoutResize, defaults.imageUrlWithoutResize),
    imageUrl: pickString(images?.imageUrl, defaults.imageUrl),
    commercialImageBase: pickString(images?.commercialImageBase, defaults.commercialImageBase),
    agencyId: pickString(images?.agencyId, defaults.agencyId),
    propertyResizeBase: pickString(images?.propertyResizeBase, defaults.propertyResizeBase),
    siteId: pickString(images?.siteId, defaults.siteId),
  }
}
