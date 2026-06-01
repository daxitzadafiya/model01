import { cookies } from 'next/headers'

import { defaultLocale, isLocale, localeCookieName, type Locale } from './config'

export async function getLocale(menuLocales?: Locale[]): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(localeCookieName)?.value

  if (isLocale(value)) {
    if (!menuLocales || menuLocales.length === 0 || menuLocales.includes(value)) {
      return value
    }
  }

  if (menuLocales?.[0]) {
    return menuLocales[0]
  }

  return defaultLocale
}
