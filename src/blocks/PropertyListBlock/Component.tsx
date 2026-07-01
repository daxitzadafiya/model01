import {
  PropertyListBlockClient,
  type PropertyListBlockClientProps,
} from '@/blocks/PropertyListBlock/Client'
import { extractImageOrigin } from '@/components/PropertyList/propertyListImagePreload'
import {
  parsePropertyListPage,
  parsePropertyListSort,
} from '@/components/PropertyList/propertyListUrl'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { getPropertyFilterOptions } from '@/utilities/getPropertyFilterOptions'
import { fetchPropertyListServerData } from '@/utilities/propertyListServer'

type Props = PropertyListBlockClientProps & {
  searchParams?: Record<string, string | string[] | undefined>
}

const DEFAULT_PAGE_SIZE = 9

export const PropertyListBlock = async ({
  listingPreset,
  pageSize,
  searchParams,
  ...rest
}: Props) => {
  const preset = (listingPreset ?? 'forSale') as CRMListingPreset
  const resolvedPageSize = Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)
  const listPage = parsePropertyListPage(searchParams)

  let initialData = null

  if (preset !== 'favorites') {
    try {
      const { locale } = await getActiveLocale()
      const filterOptions = await getPropertyFilterOptions(locale)
      const defaultSort = filterOptions.sortOptions[0]?.value ?? ''
      const listSort = parsePropertyListSort(searchParams, defaultSort)

      initialData = await fetchPropertyListServerData({
        preset,
        pageSize: resolvedPageSize,
        page: listPage,
        sortValue: listSort,
      })
    } catch (error) {
      console.error('Failed to prefetch property list', error)
    }
  }

  const imageOrigin = initialData?.preloadImageUrls?.[0]
    ? extractImageOrigin(initialData.preloadImageUrls[0])
    : null

  return (
    <>
      {imageOrigin && <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" />}
      {initialData?.preloadImageUrls?.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
      <PropertyListBlockClient
        listingPreset={listingPreset}
        pageSize={pageSize}
        initialData={initialData}
        {...rest}
      />
    </>
  )
}
