import React from 'react'

import {
  PropertyListServerDataSync,
  type PropertyListInitialData,
} from '@/components/PropertyList/PropertyListServerData'
import { extractImageOrigin } from '@/components/PropertyList/propertyListImagePreload'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { fetchPropertyListServerData } from '@/utilities/propertyListServer'

type Props = {
  preset: CRMListingPreset
  resolvedPageSize: number
  page: number
  sortValue?: string | null
  listingKey: string
}

export async function PropertyListBlockData({
  preset,
  resolvedPageSize,
  page,
  sortValue,
  listingKey,
}: Props) {
  const defaultSort = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions[0]?.value ?? 'relevance'
  let initialData: PropertyListInitialData = {
    page,
    properties: [],
    total: 0,
    sort: sortValue?.trim() || defaultSort,
    preloadImageUrls: [],
  }

  if (preset !== 'favorites') {
    try {
      const fetched = await fetchPropertyListServerData({
        preset,
        pageSize: resolvedPageSize,
        page,
        sortValue,
      })
      if (fetched) initialData = fetched
    } catch (error) {
      console.error(`Failed to prefetch property list (${preset})`, error)
    }
  }

  const imageOrigin = initialData.preloadImageUrls?.[0]
    ? extractImageOrigin(initialData.preloadImageUrls[0])
    : null

  return (
    <>
      {imageOrigin && <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" />}
      {initialData.preloadImageUrls?.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
      <PropertyListServerDataSync listingKey={listingKey} initialData={initialData} />
    </>
  )
}
