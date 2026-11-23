'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { isLocale, type Locale } from '@/i18n/config'
import { SITE_LOCALE_CHANGE_EVENT } from '@/i18n/localeEvents'

type SiteLocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const SiteLocaleContext = createContext<SiteLocaleContextValue | null>(null)

function normalizeLocale(value: string | null | undefined, fallback: Locale): Locale {
  const trimmed = value?.trim().toLowerCase()
  return trimmed && isLocale(trimmed) ? trimmed : fallback
}

type Props = {
  initialLocale: Locale
  children: React.ReactNode
}

/**
 * Provides the SSR-resolved locale to client components so `useSiteLocale()`
 * hydrates with the same value the server rendered (avoids /en vs /sv href mismatches).
 */
export const SiteLocaleProvider: React.FC<Props> = ({ initialLocale, children }) => {
  const fallback = normalizeLocale(initialLocale, 'en')
  const [locale, setLocaleState] = useState<Locale>(fallback)

  // Keep context in sync when the layout re-renders with a new server locale
  // (e.g. after language switch + router.refresh).
  useEffect(() => {
    setLocaleState(fallback)
  }, [fallback])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(normalizeLocale(next, fallback))
  }, [fallback])

  useEffect(() => {
    const syncFromDocument = () => {
      setLocaleState((prev) => normalizeLocale(document.documentElement.lang, prev))
    }

    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail?.trim()
      if (next) {
        setLocaleState((prev) => normalizeLocale(next, prev))
      } else {
        syncFromDocument()
      }
    }

    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          syncFromDocument()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => {
      window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
      observer.disconnect()
    }
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <SiteLocaleContext.Provider value={value}>{children}</SiteLocaleContext.Provider>
}

export function useSiteLocaleContext(): SiteLocaleContextValue | null {
  return useContext(SiteLocaleContext)
}
