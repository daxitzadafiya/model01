import { defaultLocale, isLocale, type Locale } from '@/i18n/config'

/** Request header set by middleware so SSR can read path locale on the same request. */
export const PATHNAME_LOCALE_HEADER = 'x-pathname-locale'

/** Cookie caching the CMS Localization default for bare-URL redirects in middleware. */
export const siteDefaultLocaleCookieName = 'payload-site-default-locale'

/**
 * Schema fallback only (`en`). Prefer CMS Localization default via
 * `/api/settings/default-locale` (see middleware).
 */
export function getSchemaDefaultLocale(): Locale {
  return defaultLocale
}

/**
 * First path segment if it is a known locale code.
 * `/fi/property-for-sale` → `fi`; `/property-for-sale` → null
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (!segment) return null
  return isLocale(segment) ? segment : null
}

/** Strip a leading locale segment: `/fi/buy` → `/buy`; `/fi` → `/` */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return '/'
  if (!isLocale(parts[0])) {
    return pathname.startsWith('/') ? pathname || '/' : `/${pathname}`
  }
  const rest = parts.slice(1).join('/')
  return rest ? `/${rest}` : '/'
}

/**
 * Ensure pathname is under a locale prefix.
 * Absolute http(s) URLs keep origin; path is rewritten.
 */
export function withLocalePrefix(pathOrUrl: string, locale: Locale): string {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return `/${locale}`

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      url.pathname = withLocalePrefix(url.pathname || '/', locale)
      return url.toString()
    } catch {
      return trimmed
    }
  }

  if (trimmed.startsWith('#')) return trimmed
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed

  const hashIndex = trimmed.indexOf('#')
  const queryIndex = trimmed.indexOf('?')
  let pathname = trimmed
  let suffix = ''

  if (hashIndex >= 0 && (queryIndex < 0 || hashIndex < queryIndex)) {
    pathname = trimmed.slice(0, hashIndex)
    suffix = trimmed.slice(hashIndex)
  } else if (queryIndex >= 0) {
    pathname = trimmed.slice(0, queryIndex)
    suffix = trimmed.slice(queryIndex)
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const withoutLocale = stripLocalePrefix(normalized)
  const prefixed =
    withoutLocale === '/' ? `/${locale}` : `/${locale}${withoutLocale}`

  return `${prefixed}${suffix}`
}

/** Swap or set the locale prefix while preserving the rest of the path + query + hash. */
export function replaceLocalePrefix(pathOrUrl: string, locale: Locale): string {
  return withLocalePrefix(pathOrUrl, locale)
}

/**
 * Build the legacy → prefixed redirect target.
 * Prefer `?lang=` when valid; otherwise `fallbackLocale`.
 * Strips `lang` from the query string; preserves other params.
 */
export function buildLocalePrefixedUrl(args: {
  pathname: string
  searchParams: URLSearchParams
  langQuery: string | null
  fallbackLocale: Locale
}): { pathname: string; search: string; locale: Locale } {
  const { pathname, searchParams, langQuery, fallbackLocale } = args
  const fromQuery =
    langQuery && isLocale(langQuery.trim().toLowerCase())
      ? (langQuery.trim().toLowerCase() as Locale)
      : null
  const locale = fromQuery ?? fallbackLocale

  const nextParams = new URLSearchParams(searchParams)
  nextParams.delete('lang')

  const stripped = stripLocalePrefix(pathname)
  const nextPath =
    stripped === '/' ? `/${locale}` : withLocalePrefix(stripped, locale)
  const search = nextParams.toString()

  return {
    locale,
    pathname: nextPath,
    search: search ? `?${search}` : '',
  }
}

/** Paths that must never receive a locale prefix. */
export function shouldSkipLocalePrefix(pathname: string): boolean {
  const path = pathname.split('?')[0] || '/'
  if (path === '/site-favicon') return true
  if (path.startsWith('/admin')) return true
  if (path.startsWith('/api')) return true
  if (path.startsWith('/next')) return true
  if (path.endsWith('-sitemap.xml') || path === '/sitemap.xml' || path === '/robots.txt') {
    return true
  }
  return false
}
