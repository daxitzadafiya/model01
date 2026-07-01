/**
 * Server-only CRM property listing fetch (GET /v3/properties/).
 */
import { getFromCRM } from '@/utilities/crmApi.server'
import { crmListingBodyToSearchParams } from '@/utilities/crmPropertiesGetParams'
import {
  extractCRMList,
  extractCRMTotal,
  type CRMFetchResult,
} from '@/utilities/crmProperties'

export async function fetchCRMPropertiesServer(
  body: Record<string, unknown>,
): Promise<CRMFetchResult> {
  const searchParams = crmListingBodyToSearchParams(body)
  const response = await getFromCRM('properties', searchParams)
  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  return { properties: list, total }
}
