/**
 * Optima CRM API helpers (client-safe).
 * Credentials are loaded from Globals → Optima CRM on the server and seeded in the root layout.
 */

import { resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'

export type CRMConfig = {
  apiUrl: string
  apiKey: string
}

export async function getCRMConfig(): Promise<CRMConfig | null> {
  const settings = resolveOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!apiUrl || !apiKey) return null

  return { apiUrl, apiKey }
}

/** e.g. commercial_properties → https://…/v3/commercial_properties?user_apikey=… */
export function buildCRMEndpoint(path: string, config: CRMConfig): string {
  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  const resource = path.replace(/^\//, '')
  return `${baseUrl}/${resource}?user_apikey=${encodeURIComponent(config.apiKey)}`
}

export async function getFromCRM(
  path: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
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

