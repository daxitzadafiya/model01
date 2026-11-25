'use client'

import { useParams } from 'next/navigation'

import { isLocale } from '@/i18n/config'
import { useSiteLocale } from '@/utilities/useSiteLocale'

/**
 * Locale from the `[locale]` URL segment.
 *
 * Prefer this for CRM/detail data fetches. The language switcher updates
 * SiteLocale context immediately (before `router.replace`), which would
 * otherwise trigger a fetch that then repeats when the locale route remounts.
 */
export function useRouteLocale(fallback = 'en'): string {
  const params = useParams<{ locale?: string }>()
  const siteLocale = useSiteLocale(fallback)
  const fromRoute = typeof params?.locale === 'string' ? params.locale : null
  return fromRoute && isLocale(fromRoute) ? fromRoute : siteLocale
}
