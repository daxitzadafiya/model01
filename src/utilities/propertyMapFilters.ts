import type { PropertyListFilters } from '@/utilities/crmProperties'

/** Map modal loads all markers — map polygon refs only filter the property list. */
export function filtersForMapMarkers(filters: PropertyListFilters): PropertyListFilters {
  const { mapReferences: _mapReferences, ...rest } = filters
  return { ...rest, mapReferences: undefined }
}
