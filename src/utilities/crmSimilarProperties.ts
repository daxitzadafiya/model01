import { MAP_FIND_ALL_POPULATE } from '@/utilities/crmPropertyMap'
import { extractCRMList, fetchCRMProperties } from '@/utilities/crmProperties'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import { isCRMTruthy } from '@/utilities/localizedValue'

export type SimilarListingContext = 'sale' | 'rent'

const SIMILAR_AVAILABLE_STATUSES = ['Available', 'Under Offer'] as const

const pickString = (candidate: unknown): string =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : ''

const pickIdentifier = (candidate: unknown): string | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  return undefined
}

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const isSeasonActive = (periodFrom: unknown, periodTo: unknown, nowMs: number): boolean => {
  const fromMs = periodFrom ? Date.parse(String(periodFrom)) : NaN
  const toMs = periodTo ? Date.parse(String(periodTo)) : NaN
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return false
  return nowMs >= fromMs && nowMs <= toMs
}

export const resolveSimilarListingContext = (
  property: Record<string, unknown>,
): SimilarListingContext => {
  if (isCRMTruthy(property.rent)) return 'rent'
  return 'sale'
}

/** Mirrors PHP `similarProperties()` price resolution for sale / rent / holiday rental. */
export const resolveSimilarPropertyPrice = (
  property: Record<string, unknown>,
  listingContext: SimilarListingContext,
): number => {
  if (listingContext === 'sale') {
    return pickNumber(property.price) ?? pickNumber(property.current_price) ?? 0
  }

  const nowMs = Date.now()

  if (listingContext === 'rent') {
    const seasons = Array.isArray(property.rental_season_data) ? property.rental_season_data : []
    let price = 0

    for (const season of seasons) {
      if (!season || typeof season !== 'object') continue
      const record = season as Record<string, unknown>
      const seasonPrice = pickNumber(record.total_per_month) ?? 0
      price = seasonPrice

      if (
        isSeasonActive(record.period_from, record.period_to, nowMs) &&
        pickNumber(record.total_per_month) != null
      ) {
        price = pickNumber(record.total_per_month) ?? 0
      }
    }

    return price
  }

  const seasons = Array.isArray(property.rental_seasons) ? property.rental_seasons : []
  let price = 0

  for (const season of seasons) {
    if (!season || typeof season !== 'object') continue
    const record = season as Record<string, unknown>
    const seasonPrice = pickNumber(record.price_per_day) ?? 0
    price = seasonPrice

    if (
      isSeasonActive(record.period_from, record.period_to, nowMs) &&
      pickNumber(record.price_per_day) != null
    ) {
      price = pickNumber(record.price_per_day) ?? 0
    }
  }

  return price
}

export const isSimilarPropertySold = (property: Record<string, unknown>): boolean =>
  pickString(property.status).toLowerCase() === 'sold'

const pickFilterKey = (property: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = property[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

type BuildSimilarQueryOptions = {
  property: Record<string, unknown>
  limit?: number
  listingContext?: SimilarListingContext
  /** Drop city/location filters to widen results when the strict query only returns the current listing. */
  relaxGeoFilters?: boolean
}

export const buildCRMSimilarPropertiesQuery = ({
  property,
  limit = 5,
  listingContext,
  relaxGeoFilters = false,
}: BuildSimilarQueryOptions): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()
  const context = listingContext ?? resolveSimilarListingContext(property)
  const price = resolveSimilarPropertyPrice(property, context)
  const priceMax = price + (25 * price) / 100
  const priceMin = price - (10 * price) / 100
  const isSold = isSimilarPropertySold(property)

  const query: Record<string, unknown> = {
    ...similarCommercials,
    archived: { $ne: true },
    has_images: true,
    status: { $in: [...SIMILAR_AVAILABLE_STATUSES] },
  }

  if (context === 'sale') {
    query.sale = true
    if (priceMax > 0) {
      query.current_price = { $gte: priceMin, $lte: priceMax }
    }
  } else {
    query.rent = true
    if (priceMax > 0) {
      query.rental_price = { $gte: priceMin, $lte: priceMax }
    }
  }

  const typeKey = pickFilterKey(property, ['type', 'type_one'])
  if (typeKey !== undefined) {
    query.type_one = { $in: [typeKey] }
  }

  if (!relaxGeoFilters) {
    const locationKey = pickFilterKey(property, ['location_key', 'location'])
    if (locationKey !== undefined) {
      query.location = { $in: [locationKey] }
    }

    const cityKey = pickFilterKey(property, ['city_key', 'city'])
    if (cityKey !== undefined) {
      query.city = { $in: [cityKey] }
    }
  }

  const propertyCrmId = pickFilterKey(property, ['id'])
  const propertyReference = pickFilterKey(property, ['reference'])

  if (propertyCrmId !== undefined) {
    query.id = { $ne: propertyCrmId }
  }
  if (propertyReference !== undefined) {
    query.reference = { $ne: propertyReference }
  }

  return {
    options: {
      page: 1,
      limit: Math.max(1, limit),
      populate: MAP_FIND_ALL_POPULATE,
      sort: { own: '-1' },
    },
    query,
  }
}

/** Mirrors PHP: only treat as the same listing when CRM `id` matches (numeric-safe). */
export const isSameCRMProperty = (
  candidate: Record<string, unknown>,
  property: Record<string, unknown>,
): boolean => {
  const currentId = pickIdentifier(property.id)
  const candidateId = pickIdentifier(candidate.id)

  if (currentId && candidateId) {
    return currentId === candidateId
  }

  const currentReference = pickIdentifier(property.reference)
  const candidateReference = pickIdentifier(candidate.reference)

  if (currentReference && candidateReference) {
    return currentReference === candidateReference
  }

  const currentMongoId = pickIdentifier(property._id)
  const candidateMongoId = pickIdentifier(candidate._id)

  if (currentMongoId && candidateMongoId) {
    return currentMongoId === candidateMongoId
  }

  return false
}

const filterOutCurrentProperty = (
  properties: Record<string, unknown>[],
  property: Record<string, unknown>,
): Record<string, unknown>[] =>
  properties.filter((candidate) => !isSameCRMProperty(candidate, property))

const mergeUniqueProperties = (
  existing: Record<string, unknown>[],
  incoming: Record<string, unknown>[],
  property: Record<string, unknown>,
  limit: number,
): Record<string, unknown>[] => {
  const seen = new Set<string>()

  const addKey = (item: Record<string, unknown>) => {
    const key =
      pickIdentifier(item._id) ??
      pickIdentifier(item.id) ??
      pickIdentifier(item.reference) ??
      undefined
    return key
  }

  const merged: Record<string, unknown>[] = []

  for (const item of [...existing, ...incoming]) {
    if (isSameCRMProperty(item, property)) continue

    const key = addKey(item)
    if (key) {
      if (seen.has(key)) continue
      seen.add(key)
    }

    merged.push(item)
    if (merged.length >= limit) break
  }

  return merged
}

export async function fetchCRMSimilarProperties({
  property,
  limit = 5,
  listingContext,
  signal,
}: {
  property: Record<string, unknown>
  limit?: number
  listingContext?: SimilarListingContext
  signal?: AbortSignal
}): Promise<Record<string, unknown>[]> {
  const resolvedLimit = Math.max(1, limit)
  const requestLimit = resolvedLimit + 1

  const fetchBatch = async (relaxGeoFilters: boolean) => {
    const body = buildCRMSimilarPropertiesQuery({
      property,
      limit: requestLimit,
      listingContext,
      relaxGeoFilters,
    })
    const { properties: batch } = await fetchCRMProperties({ body, signal })
    return filterOutCurrentProperty(batch, property)
  }

  let results = await fetchBatch(false)

  if (results.length < resolvedLimit) {
    const relaxed = await fetchBatch(true)
    results = mergeUniqueProperties(results, relaxed, property, resolvedLimit)
  }

  return results.slice(0, resolvedLimit)
}

export { extractCRMList }
