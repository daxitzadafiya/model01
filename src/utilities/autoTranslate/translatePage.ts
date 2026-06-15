import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale } from '@/i18n/locales'
import type { Page } from '@/payload-types'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { layoutHasTranslatableBlocks } from './blockRegistry'
import { AUTO_TRANSLATING_CONTEXT_KEY } from './context'
import {
  applyLayoutPatches,
  buildLayoutPatches,
  layoutLocalizedFieldsChanged,
} from './layoutTranslate'

type AutoTranslatePageLayoutArgs = {
  payload: Payload
  pageId: number | string
  sourceDoc: Page
  previousDoc?: Page | null
  /** When true, translate without comparing to previousDoc (deferred jobs). */
  skipChangeCheck?: boolean
  sourceLocale?: string
  isDraft: boolean
}

export async function autoTranslatePageLayout({
  payload,
  pageId,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
  isDraft,
}: AutoTranslatePageLayoutArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale
  const sourceLayout = sourceDoc.layout

  if (!layoutHasTranslatableBlocks(sourceLayout)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !layoutLocalizedFieldsChanged(sourceLayout, previousDoc.layout)
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info('[autoTranslate] DeepL disabled — skipping page layout translation')
    return { updatedLocales: [] }
  }

  const locales = await getSiteContentLocales(payload)
  const targetLocales = locales.filter((code) => code.toLowerCase() !== normalizedSource)

  if (targetLocales.length === 0) {
    return { updatedLocales: [] }
  }

  const translate = (text: string, targetLocale: string) =>
    translateWithDeepL(text, targetLocale, normalizedSource, deepl)

  const updatedLocales: string[] = []

  for (const targetLocale of targetLocales) {
    let targetDoc: Page | null = null

    try {
      targetDoc = await payload.findByID({
        collection: 'pages',
        id: pageId,
        locale: targetLocale,
        fallbackLocale: false,
        draft: isDraft,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      targetDoc = null
    }

    const baseLayout = targetDoc?.layout ?? sourceLayout
    const patches = await buildLayoutPatches(
      sourceLayout,
      previousDoc?.layout,
      baseLayout,
      translate,
      targetLocale,
    )
    const patchedLayout = applyLayoutPatches(baseLayout, patches)

    if (!patchedLayout) continue

    await payload.update({
      collection: 'pages',
      id: pageId,
      locale: targetLocale,
      fallbackLocale: false,
      draft: isDraft,
      depth: 0,
      data: {
        layout: patchedLayout,
      },
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
      `[autoTranslate] Page layout translated for page ${pageId}: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
