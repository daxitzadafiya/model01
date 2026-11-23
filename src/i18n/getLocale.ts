import { cookies, headers } from 'next/headers'

import { defaultLocale, isLocale, localeCookieName, type Locale } from './config'
import { PATHNAME_LOCALE_HEADER } from './localePath'

/**
 * Resolve the visitor locale.
 * 1. Path locale from middleware header (same-request SSR)
 * 2. Valid cookie (and allowed by menu when provided)
 * 3. Preferred CMS default when it is in the menu
 * 4. First menu locale
 * 5. Hardcoded schema fallback (`en`)
 */
export async function getLocale(
  menuLocales?: Locale[],
  preferredDefault: Locale = defaultLocale,
): Promise<Locale> {
  const headerStore = await headers()
  const pathLocale = headerStore.get(PATHNAME_LOCALE_HEADER)?.trim().toLowerCase()
  if (isLocale(pathLocale)) {
    if (!menuLocales || menuLocales.length === 0 || menuLocales.includes(pathLocale)) {
      return pathLocale
    }
  }

  const cookieStore = await cookies()
  const value = cookieStore.get(localeCookieName)?.value

  if (isLocale(value)) {
    if (!menuLocales || menuLocales.length === 0 || menuLocales.includes(value)) {
      return value
    }
  }

  if (menuLocales && menuLocales.length > 0) {
    if (menuLocales.includes(preferredDefault)) {
      return preferredDefault
    }
    return menuLocales[0]
  }

  return preferredDefault
}
