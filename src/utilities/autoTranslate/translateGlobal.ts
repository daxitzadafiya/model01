import type { Config } from '@/payload-types'
import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale } from '@/i18n/locales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { AUTO_TRANSLATING_CONTEXT_KEY } from './context'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  documentHasTranslatableFields,
  documentLocalizedFieldsChanged,
  type DocumentFieldRegistry,
} from './documentTranslate'

type GlobalSlug = keyof Config['globals']

type AutoTranslateGlobalArgs = {
  payload: Payload
  slug: GlobalSlug
  registry: DocumentFieldRegistry
  sourceDoc: Record<string, unknown>
  previousDoc?: Record<string, unknown> | null
  skipChangeCheck?: boolean
  sourceLocale?: string
}

export async function autoTranslateGlobal({
  payload,
  slug,
  registry,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
}: AutoTranslateGlobalArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale

  if (!documentHasTranslatableFields(registry)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !documentLocalizedFieldsChanged(sourceDoc, previousDoc, registry)
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info(`[autoTranslate] DeepL disabled — skipping ${slug} translation`)
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
    let targetDoc: Record<string, unknown> | null = null

    try {
      targetDoc = (await payload.findGlobal({
        slug,
        locale: targetLocale,
        fallbackLocale: false,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    } catch {
      targetDoc = null
    }

    const patches = await buildDocumentPatches(
      sourceDoc,
      previousDoc,
      targetDoc,
      registry,
      translate,
      targetLocale,
    )

    const data = buildUpdateDataFromPatches(patches)
    if (!data) continue

    await payload.updateGlobal({
      slug,
      locale: targetLocale,
      fallbackLocale: false,
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
      `[autoTranslate] Global "${slug}" translated: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
