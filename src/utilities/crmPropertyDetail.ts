import { fetchCRMProperties } from '@/utilities/crmProperties'

export type CRMPropertyDetailRecord = Record<string, unknown>

function getCRMViewConfig(): { apiUrl: string; userKey: string } | null {
  const apiUrl = process.env.NEXT_PUBLIC_CRM_API_URL?.trim()
  const userKey = process.env.NEXT_PUBLIC_OPTIMA_USER_KEY?.trim()

  if (!apiUrl || !userKey) return null

  return { apiUrl, userKey }
}

/** POST /v3/commercial_properties/view/{reference}?user={NEXT_PUBLIC_OPTIMA_USER_KEY} */
export async function fetchCRMPropertyDetail(
  reference: string,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<CRMPropertyDetailRecord | null> {
  const config = getCRMViewConfig()
  if (!config) {
    console.error('Missing NEXT_PUBLIC_CRM_API_URL or NEXT_PUBLIC_OPTIMA_USER_KEY')
    return null
  }

  const trimmedReference = reference.trim()
  if (!trimmedReference) return null

  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  const endpoint = `${baseUrl}/commercial_properties/view/${encodeURIComponent(trimmedReference)}?user=${encodeURIComponent(config.userKey)}`

  const { headers, ...restInit } = init ?? {}

  const response = await fetch(endpoint, {
    ...restInit,
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: '{}',
  })

  if (!response.ok) {
    console.error(`CRM property detail failed (${response.status}) for reference ${trimmedReference}`)
    return null
  }

  const data = (await response.json()) as unknown
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const record = data as CRMPropertyDetailRecord
  if (record.reference == null && !record._id) return null

  return record
}

export async function fetchCRMRelatedProperties(
  references: Array<string | number>,
  limit = 3,
): Promise<CRMPropertyDetailRecord[]> {
  const numericRefs = references
    .map((ref) => (typeof ref === 'number' ? ref : Number(String(ref).trim())))
    .filter((ref) => Number.isFinite(ref))

  if (numericRefs.length === 0) return []

  const { properties } = await fetchCRMProperties({
    body: {
      options: { limit, skip: 0 },
      query: {
        reference: { $in: numericRefs },
        similar_commercials: 'exclude_similar',
      },
    },
  })

  return properties.slice(0, limit)
}
