'use client'

import { useEffect, useState } from 'react'

const readDocumentLocale = (): string => {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

/**
 * Tracks the active site locale from `<html lang="…">`.
 * Updates immediately when the attribute changes (e.g. language switcher).
 */
export function useSiteLocale(fallback = 'en'): string {
  const [locale, setLocale] = useState(() =>
    typeof document !== 'undefined' ? readDocumentLocale() : fallback,
  )

  useEffect(() => {
    const sync = () => {
      const next = readDocumentLocale()
      setLocale((prev) => (prev === next ? prev : next))
    }

    sync()

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          sync()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => observer.disconnect()
  }, [])

  return locale
}
