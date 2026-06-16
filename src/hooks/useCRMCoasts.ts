'use client'

import { useEffect, useState } from 'react'

import { fetchCRMCoasts, type CRMCoastOption } from '@/utilities/crmCoasts'

export function useCRMCoasts() {
  const [coasts, setCoasts] = useState<CRMCoastOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextCoasts = await fetchCRMCoasts({ signal: controller.signal })
        setCoasts(nextCoasts)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM coasts', err)
        setCoasts([])
        setError('Unable to load coasts')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  return { coasts, loading, error }
}
