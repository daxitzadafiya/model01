import type { GlobalAfterChangeHook } from 'payload'

import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { COOKIE_CONSENT_FIELD_REGISTRY } from '@/utilities/autoTranslate/cookieConsentFieldRegistry'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredCookieConsentAutoTranslate } from '@/utilities/autoTranslate/runDeferredCookieConsentAutoTranslate'

export const autoTranslateCookieConsentContent: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc

  const { sourceLocale, shouldTranslate } = await resolveAutoTranslateSourceLocale(
    req.payload,
    req.locale,
  )
  if (!shouldTranslate) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>
  if (!documentHasSourceTranslatableContent(sourceRecord, COOKIE_CONSENT_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  try {
    await enqueueAutoTranslate(() => runDeferredCookieConsentAutoTranslate(job, req.payload))
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: '[autoTranslate] Cookie consent translation failed',
    })
  }

  return doc
}
