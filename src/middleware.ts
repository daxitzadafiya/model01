import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isLocale, localeCookieName, type Locale } from '@/i18n/config'
import {
  buildLocalePrefixedUrl,
  getLocaleFromPathname,
  getSchemaDefaultLocale,
  PATHNAME_LOCALE_HEADER,
  shouldSkipLocalePrefix,
  siteDefaultLocaleCookieName,
} from '@/i18n/localePath'
import { SITE_LANG_QUERY_KEY } from '@/i18n/siteLangQuery'

async function fetchCmsDefaultLocale(request: NextRequest): Promise<Locale | null> {
  try {
    const url = new URL('/api/settings/default-locale', request.nextUrl.origin)
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(1500),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { locale?: string }
    const locale = data.locale?.trim().toLowerCase()
    return locale && isLocale(locale) ? locale : null
  } catch {
    return null
  }
}

async function resolveFallbackLocale(request: NextRequest): Promise<{
  locale: Locale
  siteDefault: Locale | null
}> {
  const visitor = request.cookies.get(localeCookieName)?.value?.trim().toLowerCase()
  if (visitor && isLocale(visitor)) {
    const cachedSite = request.cookies.get(siteDefaultLocaleCookieName)?.value?.trim().toLowerCase()
    return {
      locale: visitor,
      siteDefault: cachedSite && isLocale(cachedSite) ? cachedSite : null,
    }
  }

  const fromCms = await fetchCmsDefaultLocale(request)
  if (fromCms) {
    return { locale: fromCms, siteDefault: fromCms }
  }

  const cachedSite = request.cookies.get(siteDefaultLocaleCookieName)?.value?.trim().toLowerCase()
  if (cachedSite && isLocale(cachedSite)) {
    return { locale: cachedSite, siteDefault: cachedSite }
  }

  const schema = getSchemaDefaultLocale()
  return { locale: schema, siteDefault: schema }
}

function withLocaleCookies(
  response: NextResponse,
  locale: Locale,
  siteDefault?: Locale | null,
): NextResponse {
  response.cookies.set(localeCookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  if (siteDefault && isLocale(siteDefault)) {
    response.cookies.set(siteDefaultLocaleCookieName, siteDefault, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    })
  }
  return response
}

function nextWithLocale(
  request: NextRequest,
  locale: Locale,
  siteDefault?: Locale | null,
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(PATHNAME_LOCALE_HEADER, locale)
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  return withLocaleCookies(response, locale, siteDefault)
}

/**
 * Always-prefixed locale URLs:
 * - `/{locale}/path` → sync cookie + request header
 * - `?lang=xx` or unprefixed public paths → permanent redirect to `/{locale}/path`
 * Default locale for bare URLs comes from CMS Localization (admin), not env.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkipLocalePrefix(pathname)) {
    return NextResponse.next()
  }

  const langQuery = request.nextUrl.searchParams.get(SITE_LANG_QUERY_KEY)
  const pathLocale = getLocaleFromPathname(pathname)
  const hasValidLangQuery = Boolean(langQuery && isLocale(langQuery.trim().toLowerCase()))

  // Legacy `?lang=` → prefixed path (even when a prefix is already present).
  if (hasValidLangQuery) {
    const { locale: fallback, siteDefault } = await resolveFallbackLocale(request)
    const target = buildLocalePrefixedUrl({
      pathname,
      searchParams: request.nextUrl.searchParams,
      langQuery,
      fallbackLocale: pathLocale ?? fallback,
    })
    const url = request.nextUrl.clone()
    url.pathname = target.pathname
    url.search = target.search
    return withLocaleCookies(NextResponse.redirect(url, 308), target.locale, siteDefault)
  }

  // Already prefixed → sync cookie/header for SSR.
  if (pathLocale) {
    const cachedSite = request.cookies.get(siteDefaultLocaleCookieName)?.value?.trim().toLowerCase()
    const siteDefault = cachedSite && isLocale(cachedSite) ? cachedSite : null
    // Refresh CMS default in the background cookie when missing.
    if (!siteDefault) {
      const fromCms = await fetchCmsDefaultLocale(request)
      return nextWithLocale(request, pathLocale, fromCms)
    }
    return nextWithLocale(request, pathLocale, siteDefault)
  }

  // Bare public path (incl. /download/…) → permanent redirect onto a locale prefix.
  const { locale: fallback, siteDefault } = await resolveFallbackLocale(request)
  const target = buildLocalePrefixedUrl({
    pathname,
    searchParams: request.nextUrl.searchParams,
    langQuery: null,
    fallbackLocale: fallback,
  })
  const url = request.nextUrl.clone()
  url.pathname = target.pathname
  url.search = target.search
  return withLocaleCookies(NextResponse.redirect(url, 308), target.locale, siteDefault)
}

export const config = {
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
