/**
 * Optima CRM API helpers.
 * Uses NEXT_PUBLIC_CRM_API_URL and NEXT_PUBLIC_CRM_API_KEY (same as Properties block).
 * Always sends user_apikey as a query parameter on the request URL.
 */

export type CRMConfig = {
  apiUrl: string
  apiKey: string
}

export function getCRMConfig(): CRMConfig | null {
  const apiUrl = process.env.NEXT_PUBLIC_CRM_API_URL?.trim()
  const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY?.trim()

  if (!apiUrl || !apiKey) return null

  return { apiUrl, apiKey }
}

/** e.g. commercial_properties → https://…/v3/commercial_properties?user_apikey=… */
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
  const config = getCRMConfig()
  if (!config) {
    throw new Error('Missing NEXT_PUBLIC_CRM_API_URL or NEXT_PUBLIC_CRM_API_KEY')
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
