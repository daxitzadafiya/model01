import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { localeCodes } from '@/i18n/locales'
import type { CookieConsent } from '@/payload-types'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { COOKIE_CONSENT_FIELD_REGISTRY } from './cookieConsentFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'

export type DeferredCookieConsentAutoTranslateJob = {
  doc: CookieConsent
  previousDoc?: CookieConsent | null
  sourceLocale: string
}

async function revalidateCookieConsent(): Promise<void> {
  await revalidateCacheTag('global_cookieConsent')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_cookieConsent_${locale}`)
  }
}

export async function runDeferredCookieConsentAutoTranslate(
  job: DeferredCookieConsentAutoTranslateJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: 'cookieConsent',
    registry: COOKIE_CONSENT_FIELD_REGISTRY,
    sourceDoc: job.doc as unknown as Record<string, unknown>,
    previousDoc: job.previousDoc as unknown as Record<string, unknown> | null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidateCookieConsent()
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: '[autoTranslate] Cookie consent revalidation failed after translation',
      })
    }
  }
}
