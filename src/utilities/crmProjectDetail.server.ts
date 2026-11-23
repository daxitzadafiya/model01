/**
 * Server-only Yii `constructions/view-by-ref` fetch for metadata / SSR.
 */
import { cache } from 'react'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getFromCRMContactWithQueryUsingUserKey } from '@/utilities/crmApi.server'
import { mapConstructionToPropertyRecord } from '@/utilities/crmProjects'

export type CRMProjectDetailRecord = Record<string, unknown>

export const fetchCRMProjectDetailServer = cache(
  async (
    reference: string,
    options?: { locale?: string; similarCommercials?: string },
  ): Promise<CRMProjectDetailRecord | null> => {
    const trimmedReference = reference.trim()
    if (!trimmedReference) return null

    const settings = await getOptimaCrmSettings()
    if (!settings.contactUrl.trim() || !settings.userKey.trim()) return null

    const locale = options?.locale?.trim() || 'en'
    const similarCommercials =
      options?.similarCommercials?.trim() || settings.similarCommercials || 'exclude_similar'

    try {
      const params = new URLSearchParams({
        ref: trimmedReference,
        model: 'commercial',
        similar_commercials: similarCommercials,
      })
      params.append('status[]', 'Available')

      const response = await getFromCRMContactWithQueryUsingUserKey(
        'constructions/view-by-ref',
        params,
      )

      if (!response.ok) return null

      const data = (await response.json()) as unknown
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null

      const mapped = mapConstructionToPropertyRecord(data as Record<string, unknown>, locale)
      if (mapped.reference == null && !mapped._id) return null

      return {
        ...mapped,
        _raw: data,
      }
    } catch (error) {
      console.error('CRM project detail server fetch failed', error)
      return null
    }
  },
)
