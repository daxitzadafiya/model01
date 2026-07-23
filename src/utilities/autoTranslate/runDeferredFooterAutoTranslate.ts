import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { Footer } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { FOOTER_FIELD_REGISTRY } from './footerFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredFooterAutoTranslateJob = {
  doc: Footer
  previousDoc?: Footer | null
  sourceLocale: string
}

async function revalidateFooterTags(): Promise<void> {
  await revalidateCacheTag('global_footer')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_footer_${locale}`)
  }
}

export async function runDeferredFooterAutoTranslate(
  job: DeferredFooterAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'footer',
    registry: FOOTER_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidateFooterTags()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Footer revalidation failed after translation',
      })
    }
  }
}
