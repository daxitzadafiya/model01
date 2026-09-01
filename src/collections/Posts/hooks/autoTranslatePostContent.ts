import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

import type { Post } from '@/payload-types'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { POST_FIELD_REGISTRY } from '@/utilities/autoTranslate/postFieldRegistry'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredPostAutoTranslate } from '@/utilities/autoTranslate/runDeferredPostAutoTranslate'

function isAutosaveRequest(req: PayloadRequest): boolean {
  const value = req.query?.autosave
  return value === true || value === 'true'
}

export const autoTranslatePostContent: CollectionAfterChangeHook<Post> = async ({
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

  if (
    !documentHasSourceTranslatableContent(
      doc as unknown as Record<string, unknown>,
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
