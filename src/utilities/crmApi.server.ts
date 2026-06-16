/**
 * Optima CRM API helpers (server-only).
 */
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { crmServerFetch } from '@/utilities/crmServerFetch'

export type CRMConfig = {
  apiUrl: string
  apiKey: string
}

export async function getCRMConfig(): Promise<CRMConfig | null> {
  const settings = await getOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!apiUrl || !apiKey) return null

  return { apiUrl, apiKey }
}

export function buildCRMEndpoint(path: string, config: CRMConfig): string {
  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  const resource = path.replace(/^\//, '')
  return `${baseUrl}/${resource}?user_apikey=${encodeURIComponent(config.apiKey)}`
}

/** Yii `r` routes use slashes — must not encode `/` as `%2F`. */
export function buildCRMContactEndpoint(contactUrl: string, route: string, apiKey: string): string {
  const normalizedRoute = route.replace(/^\//, '')
  if (!/^[a-zA-Z0-9/_-]+$/.test(normalizedRoute)) {
    throw new Error(`Invalid CRM contact route: ${route}`)
  }

  const separator = contactUrl.includes('?') ? '&' : '?'
  return `${contactUrl}${separator}r=${normalizedRoute}&user_apikey=${encodeURIComponent(apiKey)}`
}

export async function getFromCRMContact(
  route: string,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!contactUrl || !apiKey) {
    throw new Error(
      'CRM contact URL is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMContactEndpoint(contactUrl, route, apiKey)

  return crmServerFetch(endpoint, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

export async function postToCRMWithUserKey(
  path: string,
  body: Record<string, unknown>,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const userKey = settings.userKey.trim()

  if (!apiUrl || !userKey) {
    throw new Error(
      'CRM API user key is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const baseUrl = apiUrl.replace(/\/+$/, '')
  const resource = path.replace(/^\//, '')
  const endpoint = `${baseUrl}/${resource}?user=${encodeURIComponent(userKey)}`
  const { headers, ...restInit } = init ?? {}

  return crmServerFetch(endpoint, {
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

  return crmServerFetch(endpoint, {
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
