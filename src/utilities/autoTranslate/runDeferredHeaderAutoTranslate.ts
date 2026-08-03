import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { Header } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { HEADER_FIELD_REGISTRY } from './headerFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredHeaderAutoTranslateJob = {
  doc: Header
  previousDoc?: Header | null
  sourceLocale: string
}

async function revalidateHeaderTags(): Promise<void> {
  await revalidateCacheTag('global_header')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_header_${locale}`)
  }
}

export async function runDeferredHeaderAutoTranslate(
  job: DeferredHeaderAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'header',
    registry: HEADER_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidateHeaderTags()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Header revalidation failed after translation',
      })
    }
  }
}
