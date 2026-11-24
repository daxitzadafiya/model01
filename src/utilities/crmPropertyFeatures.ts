export type CRMFeatureValue = {
  /** Stable CRM / semantic key used for Translations (`propertyDetail.features.values.*`). */
  key: string
  /** English fallback label (or free-text that should not be key-translated). */
  label: string
  /** When false, show `label` as-is (e.g. parking address). Default true. */
  translate?: boolean
  /** Distance / bath metric shown after the translated label. */
  detail?: string
}

export type CRMFeatureGroup = {
  /** Stable group id used for translation keys. */
  key: string
  /** Canonical English group label. */
  label: string
  values: CRMFeatureValue[]
}

export type CRMPropertyFeatures = {
  groups: CRMFeatureGroup[]
  licenseNumber?: string
}

const LABEL_OVERRIDES: Record<string, string> = {
  fridge: 'Refrigerator',
  pharmacy_closeby: 'Pharmacy Close By',
  close_to_restaurant: 'Close To Restaurants',
  close_to_sea: 'Close To Sea',
  close_to_supermarkets: 'Close To Supermarkets',
  holiday_homes: 'Holiday Homes',
  bright_light: 'Bright Light',
  commercial_zone: 'Commercial Zone',
  filter_coffee_machine: 'Filter Coffee Machine',
  air_conditioning: 'Air Conditioning',
  alarm_system: 'Alarm System',
  identification_of_parking: 'Parking Identification',
  next_town: 'Centre',
  terrace: 'Terrace',
  garden: 'Garden',
}

const normalizeFeatureKey = (key: string): string =>
  key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const humanizeKey = (key: string): string => {
  const normalized = key.trim()
  const override = LABEL_OVERRIDES[normalized] || LABEL_OVERRIDES[normalized.toLowerCase()]
  if (override) return override

  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

const featureValue = (
  key: string,
  label: string,
  options?: { translate?: boolean; detail?: string },
): CRMFeatureValue => ({
  key: normalizeFeatureKey(key),
  label,
  translate: options?.translate,
  detail: options?.detail,
})

const pickString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

const pickNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

const collectTruthyKeys = (source: unknown): string[] => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []
  return Object.entries(source as Record<string, unknown>)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
}

/** Boolean flags + non-empty string fields (e.g. parking identification). */
const collectPresentEntries = (source: unknown): CRMFeatureValue[] => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []

  const values: CRMFeatureValue[] = []
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (value === true) {
      values.push(featureValue(key, humanizeKey(key)))
      continue
    }
    if (typeof value === 'string' && value.trim()) {
      const trimmed = value.trim()
      // Long free-text (addresses) stays as-is; short codes use the field label.
      if (trimmed.length > 40) {
        values.push(featureValue(key, trimmed, { translate: false }))
      } else {
        values.push(featureValue(key, humanizeKey(key)))
      }
    }
  }
  return values
}

const firstPresentObject = (
  property: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | undefined => {
  for (const key of keys) {
    const value = property[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }
  return undefined
}

const formatOrientationValue = (key: string): CRMFeatureValue => {
  for (const prefix of ['terrace', 'garden'] as const) {
    if (key.startsWith(`${prefix}_`)) {
      const directionKey = key.slice(prefix.length + 1)
      return featureValue(key, `${humanizeKey(prefix)}: ${humanizeKey(directionKey)}`)
    }
  }
  return featureValue(key, humanizeKey(key))
}

const formatViewValue = (key: string): CRMFeatureValue => {
  if (key.startsWith('view_')) {
    const viewKey = key.slice(5)
    return featureValue(key, humanizeKey(viewKey))
  }
  if (key === 'city_views') return featureValue(key, 'City')
  return featureValue(key, humanizeKey(key))
}

const formatDistanceUnit = (unit: string): string => {
  const trimmed = unit.trim()
  if (!trimmed) return ''
  if (trimmed.toLowerCase() === 'meters') return 'Meters'
  if (trimmed.toLowerCase() === 'km') return 'km'
  return trimmed
}

const collectDistanceValues = (source: unknown): CRMFeatureValue[] => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []

  const values: CRMFeatureValue[] = []
  for (const [key, raw] of Object.entries(source as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const entry = raw as Record<string, unknown>
    const amount =
      typeof entry.value === 'number'
        ? entry.value
        : typeof entry.value === 'string' && entry.value.trim()
          ? Number(entry.value)
          : NaN
    if (!Number.isFinite(amount)) continue
    const unit = typeof entry.unit === 'string' ? formatDistanceUnit(entry.unit) : ''
    const labelKey = key === 'next_town' ? 'centre' : key
    const label = humanizeKey(labelKey)
    values.push(
      featureValue(labelKey, label, {
        detail: unit ? `${amount} ${unit}` : String(amount),
      }),
    )
  }
  return values
}

const collectBathValues = (property: Record<string, unknown>): CRMFeatureValue[] => {
  const values: CRMFeatureValue[] = []

  const toilets = pickNumber(property.toilets)
  if (toilets != null) {
    values.push(
      featureValue(`toilets_${toilets}`, `${toilets} toilet/s`, {
        detail: undefined,
      }),
    )
  }

  const walkInShower = pickNumber(property.walk_in_shower)
  if (walkInShower != null) {
    values.push(featureValue(`walk_in_shower_${walkInShower}`, `${walkInShower} Walk-in shower`))
  }

  return values
}

type FeatureGroupConfig = {
  key: string
  label: string
  sources?: string[]
  format?: 'boolean' | 'orientation' | 'views' | 'distances' | 'present' | 'baths'
}

/**
 * Feature groups aligned with the legacy property detail Features table.
 * EPC is intentionally excluded (Energy Efficiency section handles it).
 */
const FEATURE_GROUPS: FeatureGroupConfig[] = [
  { key: 'setting', label: 'Setting', sources: ['feet_setting', 'settings'] },
  {
    key: 'orientation',
    label: 'Orientation',
    sources: ['feet_orientation', 'orientation'],
    format: 'orientation',
  },
  { key: 'views', label: 'Views', sources: ['feet_views', 'views'], format: 'views' },
  { key: 'distances', label: 'Distances', sources: ['distances'], format: 'distances' },
  { key: 'baths', label: 'Baths', format: 'baths' },
  { key: 'categories', label: 'Categories', sources: ['feet_categories', 'categories'] },
  { key: 'kitchen', label: 'Kitchen', sources: ['feet_kitchen', 'kitchen'] },
  {
    key: 'utilities',
    label: 'Utilities',
    sources: ['feet_utilities', 'utility', 'utilities'],
  },
  { key: 'security', label: 'Security', sources: ['feet_security', 'security'] },
  {
    key: 'climateControl',
    label: 'Climate Control',
    sources: ['feet_climate_control', 'climate_control'],
  },
  {
    key: 'parking',
    label: 'Parking',
    sources: ['feet_parking', 'parking'],
    format: 'present',
  },
  { key: 'furniture', label: 'Furniture', sources: ['feet_furniture', 'furniture'] },
  { key: 'pool', label: 'Pool', sources: ['feet_pool', 'pool'] },
  { key: 'garden', label: 'Garden', sources: ['feet_garden', 'garden'] },
  { key: 'features', label: 'Building Features', sources: ['feet_features', 'features'] },
]

const resolveGroupValues = (
  property: Record<string, unknown>,
  config: FeatureGroupConfig,
): CRMFeatureValue[] => {
  if (config.format === 'baths') {
    return collectBathValues(property)
  }

  const source = firstPresentObject(property, config.sources ?? [])
  if (!source) return []

  if (config.format === 'distances') {
    return collectDistanceValues(source)
  }

  if (config.format === 'present') {
    return collectPresentEntries(source)
  }

  const keys = collectTruthyKeys(source)
  if (keys.length === 0) return []

  if (config.format === 'orientation') {
    return keys.map(formatOrientationValue)
  }
  if (config.format === 'views') {
    return keys.map(formatViewValue)
  }
  return keys.map((key) => featureValue(key, humanizeKey(key)))
}

const resolveLicenseNumber = (property: Record<string, unknown>): string | undefined =>
  pickString(property.license_number) ||
  pickString(property.licence_number) ||
  pickString(property.tourist_license) ||
  pickString(property.license)

/**
 * Build the Features section data from Optima CRM `feet_*` groups,
 * baths counts, distances, and license number.
 */
export function normalizeCRMPropertyFeatures(
  property: Record<string, unknown>,
): CRMPropertyFeatures {
  const groups: CRMFeatureGroup[] = []

  for (const config of FEATURE_GROUPS) {
    const values = resolveGroupValues(property, config)
    if (values.length === 0) continue
    groups.push({
      key: config.key,
      label: config.label,
      values,
    })
  }

  return {
    groups,
    licenseNumber: resolveLicenseNumber(property),
  }
}

export function hasCRMPropertyFeatures(features: CRMPropertyFeatures | null | undefined): boolean {
  if (!features) return false
  return features.groups.length > 0 || Boolean(features.licenseNumber)
}

export function featureValueTranslationKey(valueKey: string): string {
  return `propertyDetail.features.values.${normalizeFeatureKey(valueKey)}`
}
