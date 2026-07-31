'use client'

import {
  useDocumentInfo,
  useFormFields,
  useLocale,
  useRouteTransition,
} from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * After Localization is saved, switch the admin content Locale menu to match
 * Default language — same navigation pattern Payload's Localizer uses.
 *
 * Note: do not key off `useFormSubmitted()` — Payload sets it back to `false`
 * on a successful save.
 */
export function SyncAdminLocaleOnSave() {
  const router = useRouter()
  const pathname = usePathname()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const { lastUpdateTime } = useDocumentInfo()
  const defaultLocale = useFormFields(
    ([fields]) => fields.defaultLocale?.value as string | undefined,
  )
  const previousUpdateTime = useRef<number | null>(null)

  useEffect(() => {
    if (!lastUpdateTime) {
      return
    }

    // Skip the initial mount value — only react to saves after this component mounts.
    if (previousUpdateTime.current === null) {
      previousUpdateTime.current = lastUpdateTime
      return
    }

    if (previousUpdateTime.current === lastUpdateTime) {
      return
    }

    previousUpdateTime.current = lastUpdateTime

    if (!defaultLocale || !locale?.code || locale.code === defaultLocale) {
      // Still refresh so Account → Language picks up Localization changes
      startRouteTransition(() => {
        router.refresh()
      })
      return
    }

    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    params.set('locale', defaultLocale)
    const url = `${pathname}?${params.toString()}`

    startRouteTransition(() => {
      router.replace(url)
      router.refresh()
    })
  }, [
    defaultLocale,
    lastUpdateTime,
    locale?.code,
    pathname,
    router,
    startRouteTransition,
  ])

  return null
}
