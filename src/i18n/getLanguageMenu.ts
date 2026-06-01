import type { Localization } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'

import { isLocale, type LanguageMenuItem } from './config'
import { getLocale } from './getLocale'
import { defaultLocale, type FlagCountry, type Locale } from './locales'

const fallbackMenu: LanguageMenuItem[] = [
  {
    id: 'en',
    locale: 'en',
    label: 'English',
    triggerCode: 'EN',
    flagCountry: 'gb',
  },
  {
    id: 'de',
    locale: 'de',
    label: 'Deutsch',
    triggerCode: 'DE',
    flagCountry: 'de',
  },
]

function mapGlobalToMenu(global: Localization | null): LanguageMenuItem[] {
  const rows = global?.languages?.filter((row) => row.enabled !== false) ?? []

  if (rows.length === 0) {
    return fallbackMenu
  }

  return rows
    .map((row, index) => {
      if (!row?.locale || !isLocale(row.locale) || !row.label || !row.shortCode || !row.flag) {
        return null
      }

      return {
        id: row.id ?? `${row.locale}-${index}`,
        locale: row.locale as Locale,
        label: row.label,
        triggerCode: row.shortCode,
        flagCountry: row.flag as FlagCountry,
      }
    })
    .filter((item): item is LanguageMenuItem => item !== null)
}

export async function getLanguageMenuItems(): Promise<LanguageMenuItem[]> {
  const global = await getCachedGlobal('localization', 0)()
  const items = mapGlobalToMenu(global)

  return items.length > 0 ? items : fallbackMenu
}

export function resolveActiveLocale(
  currentLocale: Locale,
  items: LanguageMenuItem[],
): Locale {
  if (items.some((item) => item.locale === currentLocale)) {
    return currentLocale
  }

  return items[0]?.locale ?? defaultLocale
}

export async function getActiveLocale(): Promise<{
  locale: Locale
  languageMenu: LanguageMenuItem[]
}> {
  const languageMenu = await getLanguageMenuItems()
  const menuLocales = languageMenu.map((item) => item.locale)
  const cookieLocale = await getLocale(menuLocales)

  return {
    languageMenu,
    locale: resolveActiveLocale(cookieLocale, languageMenu),
  }
}
