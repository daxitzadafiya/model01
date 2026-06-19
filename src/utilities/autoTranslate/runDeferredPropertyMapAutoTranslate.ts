import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { PropertyMap } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { PROPERTY_MAP_FIELD_REGISTRY } from './propertyMapFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredPropertyMapAutoTranslateJob = {
  doc: PropertyMap
  previousDoc?: PropertyMap | null
  sourceLocale: string
}

async function revalidatePropertyMap(): Promise<void> {
  await revalidateCacheTag('global_propertyMap')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_propertyMap_${locale}`)
  }
}

export async function runDeferredPropertyMapAutoTranslate(
  job: DeferredPropertyMapAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'propertyMap',
    registry: PROPERTY_MAP_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidatePropertyMap()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Property map revalidation failed after translation',
      })
    }
  }
}
