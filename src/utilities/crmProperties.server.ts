/**
 * Server-only CRM property listing fetch (GET /v3/properties/).
 */
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

import { getFromCRM } from '@/utilities/crmApi.server'
import { slimCRMListProperties } from '@/utilities/crmListPropertySlim'
import { crmListingBodyToSearchParams } from '@/utilities/crmPropertiesGetParams'
import {
  extractCRMList,
  extractCRMTotal,
  type CRMFetchResult,
} from '@/utilities/crmProperties'

const CRM_LIST_REVALIDATE_SECONDS = 120

async function fetchCRMPropertiesServerLive(
  searchParams: URLSearchParams,
): Promise<CRMFetchResult> {
  const paramsWithSelectedFields = new URLSearchParams(searchParams)
  paramsWithSelectedFields.set('selectedFields', '1')

  let response = await getFromCRM('properties', paramsWithSelectedFields)
  if (!response.ok) {
    response = await getFromCRM('properties', searchParams)
  }

  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = slimCRMListProperties(extractCRMList(data))
  const total = extractCRMTotal(data, list.length)

  console.info('[CRM properties GET]', {
    query: searchParams.toString(),
    count: list.length,
    total,
    references: list
      .slice(0, 5)
      .map((item) => item.reference)
      .filter(Boolean),
  })

  return { properties: list, total }
}

const getCachedCRMPropertiesList = unstable_cache(
  async (queryKey: string) => fetchCRMPropertiesServerLive(new URLSearchParams(queryKey)),
  ['crm-properties-list-v2'],
  {
    revalidate: CRM_LIST_REVALIDATE_SECONDS,
    tags: ['crm-properties-list'],
  },
)

export const fetchCRMPropertiesServer = cache(
  async (body: Record<string, unknown>): Promise<CRMFetchResult> => {
    const searchParams = crmListingBodyToSearchParams(body)
    const queryKey = searchParams.toString()
    return getCachedCRMPropertiesList(queryKey)
  },
)
