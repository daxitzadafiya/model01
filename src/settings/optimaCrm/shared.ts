import type { OptimaCrmSetting } from '@/payload-types'

export type SimilarCommercialsMode = 'include_similar' | 'only_similar' | 'exclude_similar'

export const SIMILAR_COMMERCIALS_MODES: SimilarCommercialsMode[] = [
  'include_similar',
  'only_similar',
  'exclude_similar',
]

export const DEFAULT_SIMILAR_COMMERCIALS: SimilarCommercialsMode = 'exclude_similar'

/** CRM keys that can be shown as property REF in lists/carousels/details. */
export type PropertyReferenceField = 'reference' | 'external_reference' | 'other_reference'

/** CRM keys that can be shown as project REF in lists/carousels/details. */
export type ProjectReferenceField = 'reference' | 'Agency_reference' | 'user_reference'

export const PROPERTY_REFERENCE_FIELDS: PropertyReferenceField[] = [
  'reference',
  'external_reference',
  'other_reference',
]

export const PROJECT_REFERENCE_FIELDS: ProjectReferenceField[] = [
  'reference',
  'Agency_reference',
  'user_reference',
]

export const DEFAULT_PROPERTY_REFERENCE_FIELD: PropertyReferenceField = 'reference'
export const DEFAULT_PROJECT_REFERENCE_FIELD: ProjectReferenceField = 'reference'

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
  propertyReferenceField: PropertyReferenceField
  projectReferenceField: ProjectReferenceField
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
  propertyReferenceField: DEFAULT_PROPERTY_REFERENCE_FIELD,
  projectReferenceField: DEFAULT_PROJECT_REFERENCE_FIELD,
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

function pickPropertyReferenceField(
  value: unknown,
  fallback: PropertyReferenceField,
): PropertyReferenceField {
  if (
    typeof value === 'string' &&
    PROPERTY_REFERENCE_FIELDS.includes(value as PropertyReferenceField)
  ) {
    return value as PropertyReferenceField
  }
  return fallback
}

function pickProjectReferenceField(
  value: unknown,
  fallback: ProjectReferenceField,
): ProjectReferenceField {
  if (
    typeof value === 'string' &&
    PROJECT_REFERENCE_FIELDS.includes(value as ProjectReferenceField)
  ) {
    return value as ProjectReferenceField
  }
  return fallback
}

export function similarCommercialsQueryClause(
  settings: Pick<ResolvedOptimaCrmSettings, 'similarCommercials'> = EMPTY_OPTIMA_CRM_SETTINGS,
): { similar_commercials: SimilarCommercialsMode } {
  return { similar_commercials: settings.similarCommercials }
}

/** Read a CRM reference-like value as a display string. */
export function pickCrmReferenceValue(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return undefined
}

/**
 * Resolve the REF shown in UI for a property.
 * Preferred admin field first; falls back to system `reference` when empty.
 */
export function resolvePropertyDisplayReference(
  record: Record<string, unknown>,
  preferred: PropertyReferenceField = DEFAULT_PROPERTY_REFERENCE_FIELD,
): string | undefined {
  const preferredKeys = preferred === 'reference' ? ['reference'] : [preferred]
  return (
    pickCrmReferenceValue(record, preferredKeys) ||
    pickCrmReferenceValue(record, ['reference'])
  )
}

/**
 * Resolve the REF shown in UI for a project.
 * Preferred admin field first; falls back to system `reference` when empty.
 */
export function resolveProjectDisplayReference(
  record: Record<string, unknown>,
  preferred: ProjectReferenceField = DEFAULT_PROJECT_REFERENCE_FIELD,
): string | undefined {
  const preferredKeys =
    preferred === 'Agency_reference'
      ? ['Agency_reference', 'agency_reference']
      : [preferred]
  return (
    pickCrmReferenceValue(record, preferredKeys) ||
    pickCrmReferenceValue(record, ['reference'])
  )
}

/** UI helper: prefer displayReference, else system reference. */
export function getShownReference(entity: {
  displayReference?: string
  reference?: string
}): string {
  return (entity.displayReference || entity.reference || '').trim()
}

export function resolveOptimaCrmSettingsFromGlobal(
  doc: OptimaCrmSetting | null | undefined,
): ResolvedOptimaCrmSettings {
  const api = doc?.api
  const images = doc?.images
  const properties = doc?.properties
  const reference = doc?.reference
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
    propertyReferenceField: pickPropertyReferenceField(
      reference?.propertyField,
      defaults.propertyReferenceField,
    ),
    projectReferenceField: pickProjectReferenceField(
      reference?.projectField,
      defaults.projectReferenceField,
    ),
  }
}
