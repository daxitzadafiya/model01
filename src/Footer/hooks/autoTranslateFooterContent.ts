import type { GlobalAfterChangeHook } from 'payload'

import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { GLOBAL_DELETED_AT_FIELD } from '@/plugins/trashAndVersions/constants'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import {
  documentHasSourceTranslatableContent,
  documentLocalizedFieldsChanged,
} from '@/utilities/autoTranslate/documentTranslate'
import { FOOTER_FIELD_REGISTRY } from '@/utilities/autoTranslate/footerFieldRegistry'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredFooterAutoTranslate } from '@/utilities/autoTranslate/runDeferredFooterAutoTranslate'

export const autoTranslateFooterContent: GlobalAfterChangeHook = async ({
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

  const { sourceLocale, shouldTranslate } = await resolveAutoTranslateSourceLocale(
    req.payload,
    req.locale,
  )
  if (!shouldTranslate) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>
  const previousRecord = previousDoc
    ? (previousDoc as unknown as Record<string, unknown>)
    : null

  if (!documentHasSourceTranslatableContent(sourceRecord, FOOTER_FIELD_REGISTRY)) {
    return doc
  }

  // Layout / visibility-only saves must not enqueue DeepL or bump updatedAt
  // (that triggers Payload's "Document modified" stale-data modal).
  if (!documentLocalizedFieldsChanged(sourceRecord, previousRecord, FOOTER_FIELD_REGISTRY)) {
    return doc
  }

  const job = {
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    sourceLocale,
  }

  // Do not await DeepL — keep the admin save response fast (same pattern as Pages).
  queueMicrotask(() => {
    void enqueueAutoTranslate(() => runDeferredFooterAutoTranslate(job, req.payload)).catch(
      (error) => {
        req.payload.logger.error({
          err: error,
          msg: '[autoTranslate] Deferred footer translation failed',
        })
      },
    )
  })

  return doc
}
