'use client'

import { useEffect, useSyncExternalStore } from 'react'

import {
  getTranslationSnapshot,
  isTranslationResolved,
  requestTranslation,
  subscribe,
} from '@/utilities/translationStore'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export async function tClient(
  key: string,
  language: string,
  fallbackValue: string,
): Promise<string> {
  const lang = language.trim().toLowerCase() || 'en'

  if (isTranslationResolved(key, lang)) {
    return getTranslationSnapshot(key, lang, fallbackValue)
  }

  requestTranslation(key, lang, fallbackValue)

  if (isTranslationResolved(key, lang)) {
    return getTranslationSnapshot(key, lang, fallbackValue)
  }

  return new Promise((resolve) => {
    const unsubscribe = subscribe(() => {
      if (!isTranslationResolved(key, lang)) return
      resolve(getTranslationSnapshot(key, lang, fallbackValue))
      unsubscribe()
    })
  })
}

export function useTranslation(key: string, fallbackValue: string): string {
  const locale = useSiteLocale()

  useEffect(() => {
    requestTranslation(key, locale, fallbackValue)
  }, [key, locale, fallbackValue])

  return useSyncExternalStore(
    subscribe,
    () => getTranslationSnapshot(key, locale, fallbackValue),
    () => fallbackValue,
  )
}
