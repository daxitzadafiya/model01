import type { CollectionAfterChangeHook } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import type { Page } from '@/payload-types'
import { layoutHasTranslatableBlocks } from '@/utilities/autoTranslate/blockRegistry'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { layoutLocalizedFieldsChanged } from '@/utilities/autoTranslate/layoutTranslate'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { runDeferredPageAutoTranslate } from '@/utilities/autoTranslate/runDeferredPageAutoTranslate'

export const autoTranslatePageContent: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc

  const sourceLocale = (req.locale ?? defaultLocale).trim().toLowerCase()
  if (sourceLocale !== defaultLocale) return doc

  if (!doc.layout?.length || !layoutHasTranslatableBlocks(doc.layout)) return doc

  if (previousDoc && !layoutLocalizedFieldsChanged(doc.layout, previousDoc.layout)) {
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

  queueMicrotask(() => {
    void enqueueAutoTranslate(() => runDeferredPageAutoTranslate(job)).catch((error) => {
      req.payload.logger.error({
        err: error,
        msg: '[autoTranslate] Deferred page translation failed',
      })
    })
  })

  return doc
}
