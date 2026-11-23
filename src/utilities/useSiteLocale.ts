'use client'

import { useSiteLocaleContext } from '@/providers/SiteLocale'

/**
 * Active site locale for client components.
 * Prefer the SSR-provided SiteLocaleProvider value so hydration matches server HTML.
 * Falls back to `en` only when used outside the provider (should not happen on the public site).
 */
export function useSiteLocale(fallback = 'en'): string {
  const context = useSiteLocaleContext()
  return context?.locale ?? fallback
}
