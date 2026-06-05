import type { PropertyListFilters } from '@/utilities/crmProperties'

import { EMPTY_PROPERTY_FILTERS } from './filterOptions'

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

  if (filters.location?.length) params.set('location', filters.location.join(','))
  if (filters.propertyType?.length) params.set('propertyType', filters.propertyType.join(','))

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
  if (location.length) filters.location = location

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
