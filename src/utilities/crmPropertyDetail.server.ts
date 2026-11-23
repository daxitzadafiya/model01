/**
 * Server-only NestJS `properties/view-by-ref` fetch for metadata / SSR.
 */
import { cache } from 'react'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'
import type { CRMPropertyDetailRecord } from '@/utilities/crmPropertyDetail'
import { unwrapCRMPropertyRecord } from '@/utilities/crmProperties'
import { crmServerFetch } from '@/utilities/crmServerFetch'

export const fetchCRMPropertyDetailServer = cache(
  async (
    reference: string,
    options?: { statuses?: string[] },
  ): Promise<CRMPropertyDetailRecord | null> => {
    const trimmedReference = reference.trim()
    if (!trimmedReference) return null

    const settings = await getOptimaCrmSettings()
    const nestBase = getNestCrmApiBaseUrl()
    const legacyBase = settings.apiUrl.trim().replace(/\/+$/, '')
    const baseUrl = nestBase || legacyBase
    const userKey = settings.userKey.trim()

    if (!baseUrl || !userKey) return null

    const params = new URLSearchParams({
      user: userKey,
      ref: trimmedReference,
    })

    for (const status of options?.statuses ?? []) {
      const trimmed = status.trim()
      if (trimmed) params.append('status[]', trimmed)
    }

    const endpoint = `${baseUrl}/properties/view-by-ref?${params.toString()}`

    try {
      const response = await crmServerFetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) return null

      const data = (await response.json()) as unknown
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null

      const record = unwrapCRMPropertyRecord(data as CRMPropertyDetailRecord)
      if (record.reference == null && !record._id) return null

      const topLevelBookings = (data as Record<string, unknown>).bookings
      if (Array.isArray(topLevelBookings) && !Array.isArray(record.bookings)) {
        record.bookings = topLevelBookings
      }

      return record
    } catch (error) {
      console.error('CRM property detail server fetch failed', error)
      return null
    }
  },
)
