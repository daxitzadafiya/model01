import type { GlobalAfterChangeHook } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { LOCALIZATION_FIELD_REGISTRY } from '@/utilities/autoTranslate/localizationFieldRegistry'
import { runDeferredLocalizationAutoTranslate } from '@/utilities/autoTranslate/runDeferredLocalizationAutoTranslate'

export const autoTranslateLocalizationContent: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc

  const sourceLocale = (req.locale ?? defaultLocale).trim().toLowerCase()
  if (sourceLocale !== defaultLocale) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>
  if (!documentHasSourceTranslatableContent(sourceRecord, LOCALIZATION_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  try {
    await enqueueAutoTranslate(() => runDeferredLocalizationAutoTranslate(job, req.payload))
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: '[autoTranslate] Localization display name translation failed',
    })
  }

  return doc
}
