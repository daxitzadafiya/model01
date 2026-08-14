/**
 * Optima CRM API helpers (client-safe).
 * Browser-used NestJS paths go through same-origin Next.js proxies to avoid CORS.
 * Other CRM paths still call the legacy host directly.
 */

import { resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'
import { isNestCrmListingPath, resolveCrmApiBaseUrl } from '@/settings/optimaCrm/shared'

export type CRMConfig = {
  apiUrl: string
  apiKey: string
}

/** Same-origin proxy for NestJS property listing endpoints. */
const NEST_LISTING_PROXY = '/api/crm/commercial-properties'

export async function getCRMConfig(): Promise<CRMConfig | null> {
  const settings = resolveOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!apiUrl || !apiKey) return null

  return { apiUrl, apiKey }
}

/**
 * properties/* and commercial_properties/* → NestJS MODE base.
 * Other paths → legacy NEXT_PUBLIC_CRM_API_URL.
 */
export function buildCRMEndpoint(path: string, config: CRMConfig): string {
  const resource = path.replace(/^\//, '')
  const baseUrl = resolveCrmApiBaseUrl(resource, config.apiUrl)
  return `${baseUrl}/${resource}?user_apikey=${encodeURIComponent(config.apiKey)}`
}

export async function getFromCRM(
  path: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  if (isNestCrmListingPath(path)) {
    const queryString = searchParams.toString()
    const url = queryString ? `${NEST_LISTING_PROXY}?${queryString}` : NEST_LISTING_PROXY
    return fetch(url, {
      ...init,
      method: 'GET',
      cache: 'no-store',
    })
  }

  const config = await getCRMConfig()
  if (!config) {
    throw new Error(
      'CRM API is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMEndpoint(path, config)
  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}&${queryString}` : endpoint
  return fetch(url, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

export async function postToCRM(
  path: string,
  body: Record<string, unknown>,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<Response> {
  if (isNestCrmListingPath(path)) {
    const { headers, ...restInit } = init ?? {}
    return fetch(NEST_LISTING_PROXY, {
      ...restInit,
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
  }

  const config = await getCRMConfig()
  if (!config) {
    throw new Error(
      'CRM API is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMEndpoint(path, config)
  const { headers, ...restInit } = init ?? {}

  return fetch(endpoint, {
    ...restInit,
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}
