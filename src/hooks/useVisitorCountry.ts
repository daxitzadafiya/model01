'use client'

import { useEffect, useState } from 'react'

import {
  readCachedVisitorCountry,
  writeCachedVisitorCountry,
} from '@/utilities/visitorCountry/cache'
import { fetchCountryFromIpApi } from '@/utilities/visitorCountry/ipApi'

let inflightLookup: Promise<string | null> | null = null

async function resolveVisitorCountry(): Promise<string | null> {
  const cached = readCachedVisitorCountry()
  if (cached) return cached

  if (inflightLookup) return inflightLookup

  inflightLookup = fetchCountryFromIpApi()
    .then((countryCode) => {
      if (countryCode) writeCachedVisitorCountry(countryCode)
      return countryCode
    })
    .catch(() => null)
    .finally(() => {
      inflightLookup = null
    })

  return inflightLookup
}

/**
 * Returns a cached ISO country code for the current visitor (e.g. "us", "in").
 * Uses ipapi.co (same as virtual-chatbot) and caches in localStorage for 30 days.
 *
 * Starts as null during SSR and the first client render to avoid hydration mismatches;
 * geo/cached country is applied in useEffect after mount.
 */
export function useVisitorCountry(): string | null {
  const [countryCode, setCountryCode] = useState<string | null>(null)

  useEffect(() => {
    const cached = readCachedVisitorCountry()
    if (cached) {
      setCountryCode(cached)
      return
    }

    let cancelled = false

    void resolveVisitorCountry().then((resolved) => {
      if (!cancelled && resolved) {
        setCountryCode(resolved)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return countryCode
}
