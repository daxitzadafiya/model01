import type { PropertyListFilters } from '@/utilities/crmProperties'

import {
  EMPTY_PROPERTY_FILTERS,
  parseCityFilter,
  parseCoastFilter,
  parseFeaturesFilter,
  parsePropertyTypeFilter,
  parseStatusFilter,
} from './filterOptions'

const PENDING_FILTERS_STORAGE_KEY = 'propertyList.pendingFilters'

/** Survives React Strict Mode remounts after hero → listing navigation. */
let pendingFiltersMemory: PropertyListFilters | null | undefined

export const normalizePropertyListFilters = (
  filters: PropertyListFilters,
): PropertyListFilters => ({
  ...EMPTY_PROPERTY_FILTERS,
  ...filters,
  reference: filters.reference?.trim() ?? '',
  propertyType: parsePropertyTypeFilter(filters.propertyType),
  coast: parseCoastFilter(filters.coast),
  city: parseCityFilter(filters.city),
  minPrice: filters.minPrice && filters.minPrice !== 'any' ? filters.minPrice : 'any',
  maxPrice: filters.maxPrice && filters.maxPrice !== 'any' ? filters.maxPrice : 'any',
  bedrooms: filters.bedrooms && filters.bedrooms !== 'any' ? filters.bedrooms : 'any',
  status: parseStatusFilter(filters.status),
  features: parseFeaturesFilter(filters.features),
  deliveryDate: filters.deliveryDate?.trim() ?? '',
  distanceToSea: filters.distanceToSea?.trim() ?? '',
  mapReferences: Array.isArray(filters.mapReferences)
    ? filters.mapReferences.filter(Boolean)
    : [],
})

export const savePendingPropertyListFilters = (filters: PropertyListFilters): void => {
  if (typeof window === 'undefined') return
  pendingFiltersMemory = undefined
  const normalized = normalizePropertyListFilters(filters)
  sessionStorage.setItem(PENDING_FILTERS_STORAGE_KEY, JSON.stringify(normalized))
}

/**
 * Read pending filters from hero search (sessionStorage). No URL params.
 * Cached in memory so React Strict Mode does not drop filters on remount.
 */
export const takePendingPropertyListFilters = (): PropertyListFilters | null => {
  if (pendingFiltersMemory !== undefined) {
    return pendingFiltersMemory
  }

  if (typeof window === 'undefined') {
    pendingFiltersMemory = null
    return null
  }

  const raw = sessionStorage.getItem(PENDING_FILTERS_STORAGE_KEY)
  if (!raw) {
    pendingFiltersMemory = null
    return null
  }

  sessionStorage.removeItem(PENDING_FILTERS_STORAGE_KEY)

  try {
    pendingFiltersMemory = normalizePropertyListFilters(JSON.parse(raw) as PropertyListFilters)
    return pendingFiltersMemory
  } catch {
    pendingFiltersMemory = null
    return null
  }
}

/** @deprecated Prefer takePendingPropertyListFilters */
export const consumePendingPropertyListFilters = (): PropertyListFilters | null =>
  takePendingPropertyListFilters()

export const clearPendingPropertyListFilters = (): void => {
  pendingFiltersMemory = undefined
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_FILTERS_STORAGE_KEY)
}

export const stripPropertyFilterSearchParams = (): void => {
  if (typeof window === 'undefined' || !window.location.search) return
  window.history.replaceState(null, '', window.location.pathname)
}

const splitCsv = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []

export const serializePropertyFiltersToSearchParams = (
  filters: PropertyListFilters,
): URLSearchParams => {
  const params = new URLSearchParams()

  const reference = filters.reference?.trim()
  if (reference) params.set('reference', reference)

  if (filters.propertyType?.length) params.set('propertyType', filters.propertyType.join(','))

  if (filters.coast?.length) params.set('coast', filters.coast.join(','))
  if (filters.city?.length) params.set('city', filters.city.join(','))

  if (filters.minPrice && filters.minPrice !== 'any') params.set('minPrice', filters.minPrice)
  if (filters.maxPrice && filters.maxPrice !== 'any') params.set('maxPrice', filters.maxPrice)

  if (filters.bedrooms && filters.bedrooms !== 'any') params.set('bedrooms', filters.bedrooms)
  if (filters.status?.length) params.set('status', filters.status.join(','))
  if (filters.features?.length) params.set('features', filters.features.join(','))

  const deliveryDate = filters.deliveryDate?.trim()
  if (deliveryDate) params.set('deliveryDate', deliveryDate)

  const distanceToSea = filters.distanceToSea?.trim()
  if (distanceToSea) params.set('distanceToSea', distanceToSea)

  return params
}

export const parsePropertyFiltersFromSearchParams = (
  searchParams: Pick<URLSearchParams, 'get'>,
): PropertyListFilters => {
  const filters: PropertyListFilters = { ...EMPTY_PROPERTY_FILTERS }

  const reference = searchParams.get('reference')
  if (reference) filters.reference = reference

  const location = splitCsv(searchParams.get('location'))
  if (location.length) {
    filters.coast = location
  }

  const coast = splitCsv(searchParams.get('coast'))
  if (coast.length) filters.coast = coast

  const city = splitCsv(searchParams.get('city'))
  if (city.length) filters.city = city

  const propertyType = splitCsv(searchParams.get('propertyType'))
  if (propertyType.length) filters.propertyType = propertyType

  const minPrice = searchParams.get('minPrice')
  if (minPrice) filters.minPrice = minPrice

  const maxPrice = searchParams.get('maxPrice')
  if (maxPrice) filters.maxPrice = maxPrice

  const bedrooms = searchParams.get('bedrooms')
  if (bedrooms) filters.bedrooms = bedrooms

  const status = splitCsv(searchParams.get('status'))
  if (status.length) filters.status = status

  const features = splitCsv(searchParams.get('features'))
  if (features.length) filters.features = features

  const deliveryDate = searchParams.get('deliveryDate')
  if (deliveryDate) filters.deliveryDate = deliveryDate

  const distanceToSea = searchParams.get('distanceToSea')
  if (distanceToSea) filters.distanceToSea = distanceToSea

  return filters
}

export const buildPropertyListUrl = (path: string, filters: PropertyListFilters): string => {
  const params = serializePropertyFiltersToSearchParams(filters)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
