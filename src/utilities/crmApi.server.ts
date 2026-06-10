/**
 * Optima CRM API helpers (server-only).
 */
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'

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
