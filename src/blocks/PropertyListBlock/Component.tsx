import React, { Suspense } from 'react'

import {
  PropertyListBlockClient,
  type PropertyListBlockClientProps,
} from '@/blocks/PropertyListBlock/Client'
import { PropertyListBlockData } from '@/blocks/PropertyListBlock/Data'
import {
  parsePropertyListPage,
  parsePropertyListSort,
} from '@/components/PropertyList/propertyListUrl'
import type { CRMListingPreset } from '@/utilities/crmProperties'

type Props = PropertyListBlockClientProps & {
  searchParams?: Record<string, string | string[] | undefined>
}

const DEFAULT_PAGE_SIZE = 9

export const PropertyListBlock = ({
  listingPreset,
  pageSize,
  searchParams,
  ...rest
}: Props) => {
  const preset = (listingPreset ?? 'forSale') as CRMListingPreset
  const resolvedPageSize = Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)
  const listPage = parsePropertyListPage(searchParams)
  const listSort = parsePropertyListSort(searchParams, '')
  const suspenseKey = `${preset}-${resolvedPageSize}-${listPage}-${listSort || 'default'}`

  return (
    <PropertyListBlockClient
      listingPreset={listingPreset}
      pageSize={pageSize}
      listingKey={suspenseKey}
      {...rest}
    >
      <Suspense key={suspenseKey} fallback={null}>
        <PropertyListBlockData
          preset={preset}
          resolvedPageSize={resolvedPageSize}
          page={listPage}
          sortValue={listSort || null}
          listingKey={suspenseKey}
        />
      </Suspense>
    </PropertyListBlockClient>
  )
}
