import type { PropertyListFilters } from '@/utilities/crmProperties'

export const PRICE_RANGE_OPTIONS = [
  { value: 'any', label: 'Any Price', min: 'any', max: 'any' },
  { value: '500k-1m', label: '€500k - €1M', min: '500000', max: '1000000' },
  { value: '1m-3m', label: '€1M - €3M', min: '1000000', max: '3000000' },
  { value: '3m-10m', label: '€3M - €10M', min: '3000000', max: '10000000' },
  { value: '10m+', label: '€10M+', min: '10000000', max: 'any' },
] as const

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'any', label: 'All Properties' },
  { value: 'Detached House', label: 'Detached House' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Land Plot', label: 'Land Plot' },
  { value: 'Apartment', label: 'Apartment' },
] as const

/** Property types for multi-select filters (excludes "All Properties"). */
export const PROPERTY_TYPE_FILTER_OPTIONS = PROPERTY_TYPE_OPTIONS.filter(
  (opt) => opt.value !== 'any',
)

export const parsePropertyTypeFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((type) => type && type !== 'any')
  if (value && value !== 'any') return [value]
  return []
}

export const parseLocationFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((key) => key && key !== 'any')
  if (value && value !== 'any') return [value]
  return []
}

export const parseCoastFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((key) => key && key !== 'all' && key !== 'any')
  if (value && value !== 'all' && value !== 'any') return [value]
  return []
}

export const parseCityFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((key) => key && key !== 'all' && key !== 'any')
  if (value && value !== 'all' && value !== 'any') return [value]
  return []
}

export const isCoastFilterActive = (coast?: string[]) => parseCoastFilter(coast).length > 0

export const isCityFilterActive = (city?: string[]) => parseCityFilter(city).length > 0

export const MIN_PRICE_OPTIONS = [
  { value: 'any', label: 'Any Min Price' },
  { value: '500000', label: '€500,000' },
  { value: '1000000', label: '€1,000,000' },
  { value: '3000000', label: '€3,000,000' },
  { value: '10000000', label: '€10,000,000' },
] as const

export const MAX_PRICE_OPTIONS = [
  { value: 'any', label: 'Any Max Price' },
  { value: '1000000', label: '€1,000,000' },
  { value: '3000000', label: '€3,000,000' },
  { value: '10000000', label: '€10,000,000' },
  { value: '50000000', label: '€50,000,000+' },
] as const

/** Internal filter value — keep stable for URL/CRM; label is "Need More". */
export const COUNT_FILTER_OTHER_VALUE = 'other'

export const BEDROOM_OPTIONS = [
  { value: 'any', label: 'Any Bedrooms' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: COUNT_FILTER_OTHER_VALUE, label: 'Need More' },
] as const

export const BATHROOM_OPTIONS = [
  { value: 'any', label: 'Any Bathrooms' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: COUNT_FILTER_OTHER_VALUE, label: 'Need More' },
] as const

/** Resolves a bedrooms/bathrooms dropdown (+ optional custom) to a CRM integer count. */
export const parseCountFilterValue = (value?: string, custom?: string): number | undefined => {
  if (!value || value === 'any') return undefined

  if (value === COUNT_FILTER_OTHER_VALUE) {
    const parsed = parseInt(custom?.replace(/\D/g, '') ?? '', 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export const isCountFilterActive = (value?: string, custom?: string): boolean =>
  parseCountFilterValue(value, custom) !== undefined

export const PROPERTY_LISTING_STATUS_OPTIONS = [
  { id: 'property_project', value: 'project', label: 'New development' },
  { id: 'property_resale', value: 'resale', label: 'Resale' },
] as const

export const STATUS_FILTER_OPTIONS = PROPERTY_LISTING_STATUS_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}))

export const parseStatusFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((item) => item && item !== 'any')
  if (value && value !== 'any') return [value]
  return []
}

export const PROPERTY_LISTING_FEATURE_OPTIONS = [
  { id: 'features_sea_views', value: 'sea views', label: 'Sea view' },
  { id: 'features_mountain', value: 'mountain', label: 'Mountain' },
  { id: 'features_golf', value: 'golf', label: 'Golf' },
] as const

export const FEATURE_FILTER_OPTIONS = PROPERTY_LISTING_FEATURE_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}))

export const parseFeaturesFilter = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter((item) => item && item !== 'any')
  if (value && value !== 'any') return [value]
  return []
}

export const DELIVERY_OPTIONS = [
  { value: '', label: 'Delivery date' },
  { value: '1', label: 'Handover' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
  { value: '18', label: '18 months' },
  { value: '60', label: '18 months or older' },
] as const

export const DISTANCE_OPTIONS = [
  { value: '', label: 'Distance to the sea' },
  { value: '600', label: 'Less than 600 m' },
  { value: '1000', label: 'Less than 1 km' },
  { value: '3000', label: 'Less than 3 km' },
  { value: '6000', label: 'Less than 6 km' },
  { value: '12000', label: 'Less than 12 km' },
  { value: '1000000', label: 'Indifferent' },
] as const

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent', sort: { created_at: -1 } },
  { value: 'relevance', label: 'Relevance', sort: { featured: -1 } },
  { value: 'priceAsc', label: 'Lowest Price', sort: { current_price: 1 } },
  { value: 'priceDesc', label: 'Highest Price', sort: { current_price: -1 } },
] as const

export type FilterOption = { value: string; label: string }

export type PriceRangeOption = { value: string; label: string; min: string; max: string }

export const resolvePriceRangeValue = (
  minPrice?: string,
  maxPrice?: string,
  options: readonly PriceRangeOption[] = PRICE_RANGE_OPTIONS,
): string => {
  const min = minPrice ?? 'any'
  const max = maxPrice ?? 'any'
  const match = options.find((opt) => opt.min === min && opt.max === max)
  return match?.value ?? 'any'
}

export const applyPriceRangeValue = (
  range: string,
  options: readonly PriceRangeOption[] = PRICE_RANGE_OPTIONS,
): { minPrice: string; maxPrice: string } => {
  const match = options.find((opt) => opt.value === range)
  if (!match) return { minPrice: 'any', maxPrice: 'any' }
  return { minPrice: match.min, maxPrice: match.max }
}

export const hasAppliedPropertyFilters = (filters: PropertyListFilters): boolean => {
  return Boolean(
    filters.reference?.trim() ||
    filters.propertyType?.length ||
    isCoastFilterActive(filters.coast) ||
    isCityFilterActive(filters.city) ||
    (filters.minPrice && filters.minPrice !== 'any') ||
    (filters.maxPrice && filters.maxPrice !== 'any') ||
    isCountFilterActive(filters.bedrooms, filters.bedroomsCustom) ||
    isCountFilterActive(filters.bathrooms, filters.bathroomsCustom) ||
    filters.features?.length ||
    filters.mapReferences?.length,
  )
}

export const EMPTY_PROPERTY_FILTERS = {
  reference: '',
  propertyType: [] as string[],
  coast: [] as string[],
  city: [] as string[],
  minPrice: 'any',
  maxPrice: 'any',
  bedrooms: 'any',
  bedroomsCustom: '',
  bathrooms: 'any',
  bathroomsCustom: '',
  features: [] as string[],
  mapReferences: [] as string[],
} as const

type PropertyFiltersShape = {
  reference?: string
  propertyType?: string | string[]
  coast?: string | string[]
  city?: string | string[]
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  bedroomsCustom?: string
  bathrooms?: string
  bathroomsCustom?: string
  features?: string | string[]
  mapReferences?: string[]
}

export const hasActivePropertyFilters = (filters: PropertyFiltersShape): boolean => {
  if (filters.reference?.trim()) return true
  if (parsePropertyTypeFilter(filters.propertyType).length > 0) return true
  if (isCoastFilterActive(parseCoastFilter(filters.coast))) return true
  if (isCityFilterActive(parseCityFilter(filters.city))) return true
  if (filters.minPrice && filters.minPrice !== 'any') return true
  if (filters.maxPrice && filters.maxPrice !== 'any') return true
  if (isCountFilterActive(filters.bedrooms, filters.bedroomsCustom)) return true
  if (isCountFilterActive(filters.bathrooms, filters.bathroomsCustom)) return true
  if (parseFeaturesFilter(filters.features).length > 0) return true
  if (filters.mapReferences?.length) return true

  return false
}
