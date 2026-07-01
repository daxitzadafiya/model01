import type { PropertyListInitialData } from '@/components/PropertyList/PropertyListView'
import { extractPropertyListPreloadImageUrls } from '@/components/PropertyList/propertyListImagePreload'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import {
  buildCRMListingQuery,
  type CRMListingPreset,
} from '@/utilities/crmProperties'
import { fetchCRMPropertiesServer } from '@/utilities/crmProperties.server'
import { getPropertyFilterOptions } from '@/utilities/getPropertyFilterOptions'

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

  const { locale } = await getActiveLocale()
  const filterOptions = await getPropertyFilterOptions(locale)
  const sortOption =
    filterOptions.sortOptions.find((option) => option.value === sortValue) ??
    filterOptions.sortOptions[0]

  if (!sortOption) return null

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
