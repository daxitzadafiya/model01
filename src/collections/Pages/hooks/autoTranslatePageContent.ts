import type { CollectionAfterChangeHook } from 'payload'

import type { Page } from '@/payload-types'
import { layoutHasTranslatableBlocks } from '@/utilities/autoTranslate/blockRegistry'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { layoutLocalizedFieldsChanged } from '@/utilities/autoTranslate/layoutTranslate'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredPageAutoTranslate } from '@/utilities/autoTranslate/runDeferredPageAutoTranslate'
import {
  isAutosaveRequest,
  scheduleAutoTranslate,
} from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslatePageContent: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc
  if (isAutosaveRequest(req)) return doc

  const { sourceLocale, shouldTranslate } = await resolveAutoTranslateSourceLocale(
    req.payload,
    req.locale,
  )
  if (!shouldTranslate) return doc

  if (!doc.layout?.length || !layoutHasTranslatableBlocks(doc.layout)) return doc

  if (
    previousDoc &&
    !layoutLocalizedFieldsChanged(doc.layout, previousDoc.layout)
  ) {
    return doc
  }

  const job = {
    pageId: doc.id,
    slug: doc.slug,
    layout: structuredClone(doc.layout),
    previousLayout: previousDoc?.layout ? structuredClone(previousDoc.layout) : null,
    isDraft: doc._status !== 'published',
    sourceLocale,
  }

  scheduleAutoTranslate(
    () => runDeferredPageAutoTranslate(job),
    (error) => {
      req.payload.logger.error({
        err: error,
        msg: '[autoTranslate] page translation failed',
      })
    },
  )

  return doc
}
