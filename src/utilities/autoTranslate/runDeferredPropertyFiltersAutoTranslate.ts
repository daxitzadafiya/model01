import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { PropertyFilter } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { PROPERTY_FILTERS_FIELD_REGISTRY } from './propertyFiltersFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredPropertyFiltersAutoTranslateJob = {
  doc: PropertyFilter
  previousDoc?: PropertyFilter | null
  sourceLocale: string
}

async function revalidatePropertyFiltersTags(): Promise<void> {
  await revalidateCacheTag('global_propertyFilters')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_propertyFilters_${locale}`)
  }
}

export async function runDeferredPropertyFiltersAutoTranslate(
  job: DeferredPropertyFiltersAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'propertyFilters',
    registry: PROPERTY_FILTERS_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidatePropertyFiltersTags()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Property filters revalidation failed after translation',
      })
    }
  }
}
