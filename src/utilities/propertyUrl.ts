import { buildCRMLocaleCandidates, isCRMTruthy } from '@/utilities/localizedValue'

export type PropertyListingMode = 'sale' | 'rent'

type LocalizedUrlMap = Record<string, string>

type PropertyUrlMaps = {
  urlsWithoutDomain?: Record<string, LocalizedUrlMap>
  propertyUrls?: Record<string, LocalizedUrlMap>
}

const PROPERTY_URL_KEYS = {
  sale: 'sale_url',
  rent: 'rent_url',
} as const

const PROPERTY_DETAILS_PATH = '/property-details'

/** Extract numeric CRM reference from a URL slug (e.g. `luxury-villa-in-calpe_618268` → `618268`). */
export function extractReferenceFromSlug(slug: string): string {
  const segment = decodeURIComponent(slug).split('/').pop() ?? slug
  const match = segment.match(/_(\d+)$/)
  if (match) return match[1]
  return segment.replace(/^_/, '').trim()
}

function readPropertyUrlMaps(property: Record<string, unknown>): PropertyUrlMaps {
  const urlsWithoutDomain = property.urls_without_domain
  const propertyUrls = property.property_urls

  return {
    urlsWithoutDomain:
      urlsWithoutDomain && typeof urlsWithoutDomain === 'object' && !Array.isArray(urlsWithoutDomain)
        ? (urlsWithoutDomain as Record<string, LocalizedUrlMap>)
        : undefined,
    propertyUrls:
      propertyUrls && typeof propertyUrls === 'object' && !Array.isArray(propertyUrls)
        ? (propertyUrls as Record<string, LocalizedUrlMap>)
        : undefined,
  }
}

function pickLocalizedUrlValue(
  urlMap: LocalizedUrlMap | undefined,
  locale: string,
): string | undefined {
  if (!urlMap || typeof urlMap !== 'object') return undefined

  const candidates = buildCRMLocaleCandidates(locale)
  const entries = Object.entries(urlMap)

  for (const candidate of candidates) {
    const direct = urlMap[candidate]
    if (typeof direct === 'string' && direct.trim()) return direct.trim()

    const match = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (match && typeof match[1] === 'string' && match[1].trim()) {
      return match[1].trim()
    }
  }

  const fallback = urlMap.en ?? urlMap.EN
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : undefined
}

function normalizeCrmUrlPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname
      return pathname.replace(/^\/+/, '')
    } catch {
      return trimmed
    }
  }

  return trimmed.replace(/^\/+/, '')
}

function extractSlugFromCrmPath(path: string): string | undefined {
  const normalized = normalizeCrmUrlPath(path)
  if (!normalized) return undefined

  const slug = normalized.split('/').filter(Boolean).pop()
  return slug || undefined
}

function isBareReferenceSlug(slug: string): boolean {
  return /^_\d+$/.test(slug)
}

function getLocalizedUrlPath(
  maps: PropertyUrlMaps,
  locale: string,
  mode: PropertyListingMode,
): string | undefined {
  const urlKey = PROPERTY_URL_KEYS[mode]

  const pathWithoutDomain = pickLocalizedUrlValue(maps.urlsWithoutDomain?.[urlKey], locale)
  if (pathWithoutDomain) return normalizeCrmUrlPath(pathWithoutDomain)

  const fullUrl = pickLocalizedUrlValue(maps.propertyUrls?.[urlKey], locale)
  if (fullUrl) return normalizeCrmUrlPath(fullUrl)

  return undefined
}

/** Prefer sale URL slug when property is for sale, otherwise rent URL slug. */
export function resolvePropertyListingMode(property: Record<string, unknown>): PropertyListingMode {
  if (isCRMTruthy(property.sale)) return 'sale'
  if (isCRMTruthy(property.rent)) return 'rent'
  return 'sale'
}

export function getPropertyDetailSlug(
  property: Record<string, unknown>,
  locale: string,
  mode: PropertyListingMode = 'sale',
): string | undefined {
  const maps = readPropertyUrlMaps(property)
  const primaryPath = getLocalizedUrlPath(maps, locale, mode)
  const primarySlug = primaryPath ? extractSlugFromCrmPath(primaryPath) : undefined

  if (primarySlug && !isBareReferenceSlug(primarySlug)) {
    return primarySlug
  }

  const alternateMode: PropertyListingMode = mode === 'sale' ? 'rent' : 'sale'
  const alternatePath = getLocalizedUrlPath(maps, locale, alternateMode)
  const alternateSlug = alternatePath ? extractSlugFromCrmPath(alternatePath) : undefined

  if (alternateSlug && !isBareReferenceSlug(alternateSlug)) {
    return alternateSlug
  }

  return primarySlug ?? alternateSlug
}

/** Public site href — `/property-details/{locale-specific slug from CRM urls}`. */
export function resolvePropertyDetailHref(
  property: Record<string, unknown>,
  locale: string,
  options?: { listingMode?: PropertyListingMode },
): string | undefined {
  const listingMode = options?.listingMode ?? resolvePropertyListingMode(property)
  const slug = getPropertyDetailSlug(property, locale, listingMode)

  if (slug) {
    return `${PROPERTY_DETAILS_PATH}/${encodeURIComponent(slug)}`
  }

  const referenceRaw = property.reference ?? property.id
  const reference =
    typeof referenceRaw === 'number'
      ? String(referenceRaw)
      : typeof referenceRaw === 'string' && referenceRaw.trim()
        ? referenceRaw.trim()
        : undefined

  if (!reference) return undefined

  return `${PROPERTY_DETAILS_PATH}/_${reference}`
}
