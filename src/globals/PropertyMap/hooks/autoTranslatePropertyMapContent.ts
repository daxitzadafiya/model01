import type { GlobalAfterChangeHook } from 'payload'

import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { PROPERTY_MAP_FIELD_REGISTRY } from '@/utilities/autoTranslate/propertyMapFieldRegistry'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredPropertyMapAutoTranslate } from '@/utilities/autoTranslate/runDeferredPropertyMapAutoTranslate'

export const autoTranslatePropertyMapContent: GlobalAfterChangeHook = async ({
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
  if (!documentHasSourceTranslatableContent(sourceRecord, PROPERTY_MAP_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  try {
    await enqueueAutoTranslate(() => runDeferredPropertyMapAutoTranslate(job, req.payload))
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: '[autoTranslate] Property map translation failed',
    })
  }

  return doc
}
