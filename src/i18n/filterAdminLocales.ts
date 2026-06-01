import type { LocalizationConfigWithLabels, PayloadRequest } from 'payload'

import { defaultLocale } from './locales'

type PayloadLocale = LocalizationConfigWithLabels['locales'][number]

const fallbackCodes = ['en', 'de'] as const

/**
 * Limits the Payload admin "Locale" menu to languages saved in Globals → Localization
 * (with "Show on site" enabled).
 */
export async function filterAdminLocales({
  locales,
  req,
}: {
  locales: PayloadLocale[]
  req: PayloadRequest
}): Promise<PayloadLocale[]> {
  try {
    const global = await req.payload.findGlobal({
      slug: 'localization',
      depth: 0,
      overrideAccess: true,
    })

    const rows = global?.languages?.filter((row) => row.enabled !== false && row.locale) ?? []

    if (rows.length === 0) {
      return locales.filter((locale) => fallbackCodes.includes(locale.code as 'en' | 'de'))
    }

    const codes = new Set(rows.map((row) => String(row.locale)))

    const filtered = locales
      .filter((locale) => codes.has(locale.code))
      .map((locale) => {
        const row = rows.find((r) => r.locale === locale.code)
        if (row?.label) {
          return { ...locale, label: row.label }
        }
        return locale
      })

    if (filtered.length > 0) {
      return filtered
    }

    const defaultEntry = locales.find((locale) => locale.code === defaultLocale)
    return defaultEntry ? [defaultEntry] : locales.slice(0, 1)
  } catch {
    return locales.filter((locale) => fallbackCodes.includes(locale.code as 'en' | 'de'))
  }
}
