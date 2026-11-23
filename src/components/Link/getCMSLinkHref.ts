import type { Page, Post } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import { stripLocalePrefix, withLocalePrefix } from '@/i18n/localePath'

export type CMSLinkHrefInput = {
  type?: 'custom' | 'reference' | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number | null
  } | null
  url?: string | null
}

export function getCMSLinkHref(
  { type, reference, url }: CMSLinkHrefInput,
  locale?: Locale | null,
): string | null {
  // `typeof null === 'object'` — guard null (e.g. trashed / missing populated docs)
  const value = reference?.value
  let href: string | null = null

  if (type === 'reference' && value && typeof value === 'object' && value.slug) {
    href =
      reference.relationTo !== 'pages'
        ? `/${reference.relationTo}/${value.slug}`
        : `/${value.slug}`
  } else {
    href = url ?? null
  }

  if (!href || !locale) return href
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href
  }
  return withLocalePrefix(href, locale)
}

export function isCMSLinkActive(pathname: string, href: string): boolean {
  const normalize = (path: string) => {
    const stripped = stripLocalePrefix(path)
    return stripped.length > 1 && stripped.endsWith('/') ? stripped.slice(0, -1) : stripped
  }
  const path = normalize(pathname)
  const link = normalize(href)

  if (link === '/home' || link === '/') {
    return path === '/' || path === '/home'
  }

  if (path === link) {
    return true
  }

  return path.startsWith(`${link}/`)
}
