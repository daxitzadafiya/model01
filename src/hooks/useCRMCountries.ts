'use client'

import { useEffect, useState } from 'react'

import { fetchCRMCountries, type CRMCountryOption } from '@/utilities/crmCountries'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export function useCRMCountries() {
  const locale = useSiteLocale()
  const [countries, setCountries] = useState<CRMCountryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextCountries = await fetchCRMCountries(locale, { signal: controller.signal })
        setCountries(nextCountries)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM countries', err)
        setCountries([])
        setError('Unable to load countries')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale])

  return { countries, loading, error }
}
