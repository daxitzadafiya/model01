import type { GlobalAfterChangeHook } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { FOOTER_FIELD_REGISTRY } from '@/utilities/autoTranslate/footerFieldRegistry'
import { runDeferredFooterAutoTranslate } from '@/utilities/autoTranslate/runDeferredFooterAutoTranslate'

export const autoTranslateFooterContent: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc

  const sourceLocale = (req.locale ?? defaultLocale).trim().toLowerCase()
  if (sourceLocale !== defaultLocale) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>
  if (!documentHasSourceTranslatableContent(sourceRecord, FOOTER_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  try {
    await enqueueAutoTranslate(() => runDeferredFooterAutoTranslate(job, req.payload))
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: '[autoTranslate] Footer translation failed',
    })
  }

  return doc
}
