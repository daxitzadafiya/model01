import { isLocale, type Locale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/localePath'

/** @deprecated Prefer path prefix `/{locale}/…`. Kept for legacy `?lang=` redirect parsing. */
export const SITE_LANG_QUERY_KEY = 'lang'

export function parseLocaleQueryParam(value: unknown): Locale | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return isLocale(trimmed) ? trimmed : null
}

export function resolveLocaleFromSearchParams(
  searchParams?:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null,
): Locale | null {
  if (!searchParams) return null

  if (searchParams instanceof URLSearchParams) {
    return parseLocaleQueryParam(searchParams.get(SITE_LANG_QUERY_KEY))
  }

  const raw = searchParams[SITE_LANG_QUERY_KEY]
  const value = Array.isArray(raw) ? raw[0] : raw
  return parseLocaleQueryParam(value)
}

/**
 * Ensure absolute or path URL carries the active locale as a path prefix.
 * Legacy name kept for call sites; no longer appends `?lang=`.
 */
export function withSiteLangQuery(url: string, locale: Locale): string {
  return withLocalePrefix(url, locale)
}

/** Map site locale → Open Graph `og:locale` (language_TERRITORY). */
export function toOpenGraphLocale(locale: Locale): string {
  const map: Partial<Record<Locale, string>> = {
    en: 'en_GB',
    de: 'de_DE',
    el: 'el_GR',
    fr: 'fr_FR',
    es: 'es_ES',
    it: 'it_IT',
    nl: 'nl_NL',
    fi: 'fi_FI',
    ru: 'ru_RU',
    pl: 'pl_PL',
    uk: 'uk_UA',
    ro: 'ro_RO',
    tr: 'tr_TR',
    hu: 'hu_HU',
    sv: 'sv_SE',
    cs: 'cs_CZ',
    pt: 'pt_PT',
    sr: 'sr_RS',
    bg: 'bg_BG',
    hr: 'hr_HR',
    da: 'da_DK',
  }

  return map[locale] ?? `${locale}_${locale.toUpperCase()}`
}
