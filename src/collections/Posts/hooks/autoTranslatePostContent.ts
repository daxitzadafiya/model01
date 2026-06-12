import type { CollectionAfterChangeHook } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import type { Post } from '@/payload-types'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentLocalizedFieldsChanged } from '@/utilities/autoTranslate/documentTranslate'
import { POST_FIELD_REGISTRY } from '@/utilities/autoTranslate/postFieldRegistry'
import { runDeferredPostAutoTranslate } from '@/utilities/autoTranslate/runDeferredPostAutoTranslate'

export const autoTranslatePostContent: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc

  const sourceLocale = (req.locale ?? defaultLocale).trim().toLowerCase()
  if (sourceLocale !== defaultLocale) return doc

  if (
    !documentLocalizedFieldsChanged(
      doc as unknown as Record<string, unknown>,
      previousDoc as unknown as Record<string, unknown> | undefined,
      POST_FIELD_REGISTRY,
    )
  ) {
    return doc
  }

  const job = {
    postId: doc.id,
    slug: doc.slug,
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    isDraft: doc._status !== 'published',
    sourceLocale,
  }

  queueMicrotask(() => {
    void enqueueAutoTranslate(() => runDeferredPostAutoTranslate(job)).catch((error) => {
      req.payload.logger.error({
        err: error,
        msg: '[autoTranslate] Deferred post translation failed',
      })
    })
  })

  return doc
}
