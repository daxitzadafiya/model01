import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { Localization } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { LOCALIZATION_FIELD_REGISTRY } from './localizationFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredLocalizationAutoTranslateJob = {
  doc: Localization
  previousDoc?: Localization | null
  sourceLocale: string
}

async function revalidateLocalizationTags(): Promise<void> {
  await revalidateCacheTag('global_localization')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_localization_${locale}`)
  }
}

export async function runDeferredLocalizationAutoTranslate(
  job: DeferredLocalizationAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'localization',
    registry: LOCALIZATION_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidateLocalizationTags()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Localization revalidation failed after display name translation',
      })
    }
  }
}
