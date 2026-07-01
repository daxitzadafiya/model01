import type { PropertyListInitialData } from '@/components/PropertyList/PropertyListServerData'
import { extractPropertyListPreloadImageUrls } from '@/components/PropertyList/propertyListImagePreload'
import { buildCRMListingQuery, type CRMListingPreset } from '@/utilities/crmProperties'
import { fetchCRMPropertiesServer } from '@/utilities/crmProperties.server'
import { resolveListingSortOption } from '@/utilities/resolveListingSortOption'

export async function fetchPropertyListServerData({
  preset,
  pageSize,
  page,
  sortValue,
}: {
  preset: CRMListingPreset
  pageSize: number
  page: number
  sortValue?: string | null
}): Promise<PropertyListInitialData | null> {
  if (preset === 'favorites') return null

  const sortOption = await resolveListingSortOption(sortValue)

  const body = buildCRMListingQuery({
    preset,
    page,
    pageSize,
    filters: {},
    sortParams: sortOption.sort,
  })

  const result = await fetchCRMPropertiesServer(body)

  return {
    page,
    properties: result.properties,
    total: result.total,
    sort: sortOption.value,
    preloadImageUrls: extractPropertyListPreloadImageUrls(result.properties),
  }
}
