import type { GlobalAfterChangeHook } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import { GLOBAL_DELETED_AT_FIELD } from '@/plugins/trashAndVersions/constants'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { HEADER_FIELD_REGISTRY } from '@/utilities/autoTranslate/headerFieldRegistry'
import { runDeferredHeaderAutoTranslate } from '@/utilities/autoTranslate/runDeferredHeaderAutoTranslate'

export const autoTranslateHeaderContent: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc
  if (
    context?.globalTrashAction ||
    context?.restoreNavItem ||
    context?.skipAutoTranslate ||
    context?.disableRevalidate
  ) {
    return doc
  }

  if ((doc as Record<string, unknown>)?.[GLOBAL_DELETED_AT_FIELD]) {
    return doc
  }

  const sourceLocale = (req.locale ?? defaultLocale).trim().toLowerCase()
  if (sourceLocale !== defaultLocale) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>
  if (!documentHasSourceTranslatableContent(sourceRecord, HEADER_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  try {
    await enqueueAutoTranslate(() => runDeferredHeaderAutoTranslate(job, req.payload))
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: '[autoTranslate] Header translation failed',
    })
  }

  return doc
}
