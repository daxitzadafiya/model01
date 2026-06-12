import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale } from '@/i18n/locales'
import type { Post } from '@/payload-types'
import { getDeepLSettings } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { AUTO_TRANSLATING_CONTEXT_KEY } from './context'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  documentHasTranslatableFields,
  documentLocalizedFieldsChanged,
} from './documentTranslate'
import { POST_FIELD_REGISTRY } from './postFieldRegistry'

type AutoTranslatePostArgs = {
  payload: Payload
  postId: number | string
  sourceDoc: Post
  previousDoc?: Post | null
  skipChangeCheck?: boolean
  sourceLocale?: string
  isDraft: boolean
}

export async function autoTranslatePost({
  payload,
  postId,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
  isDraft,
}: AutoTranslatePostArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale
  const registry = POST_FIELD_REGISTRY

  if (!documentHasTranslatableFields(registry)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !documentLocalizedFieldsChanged(
      sourceDoc as unknown as Record<string, unknown>,
      previousDoc as unknown as Record<string, unknown> | null,
      registry,
    )
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettings()
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info('[autoTranslate] DeepL disabled — skipping post translation')
    return { updatedLocales: [] }
  }

  const locales = await getSiteContentLocales(payload)
  const targetLocales = locales.filter((code) => code.toLowerCase() !== normalizedSource)

  if (targetLocales.length === 0) {
    return { updatedLocales: [] }
  }

  const translate = (text: string, targetLocale: string) =>
    translateWithDeepL(text, targetLocale, normalizedSource)

  const updatedLocales: string[] = []
  const sourceRecord = sourceDoc as unknown as Record<string, unknown>

  for (const targetLocale of targetLocales) {
    let targetDoc: Post | null = null

    try {
      targetDoc = await payload.findByID({
        collection: 'posts',
        id: postId,
        locale: targetLocale,
        fallbackLocale: false,
        draft: isDraft,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      targetDoc = null
    }

    const patches = await buildDocumentPatches(
      sourceRecord,
      previousDoc as unknown as Record<string, unknown> | null,
      targetDoc as unknown as Record<string, unknown> | null,
      registry,
      translate,
      targetLocale,
    )

    const data = buildUpdateDataFromPatches(patches)
    if (!data) continue

    await payload.update({
      collection: 'posts',
      id: postId,
      locale: targetLocale,
      fallbackLocale: false,
      draft: isDraft,
      depth: 0,
      data,
      context: {
        [AUTO_TRANSLATING_CONTEXT_KEY]: true,
        disableRevalidate: true,
      },
      overrideAccess: true,
    })

    updatedLocales.push(targetLocale)
  }

  if (updatedLocales.length > 0) {
    payload.logger.info(
      `[autoTranslate] Post translated for post ${postId}: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
