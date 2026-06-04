import { postToCRM } from '@/utilities/crmApi'
import { getPublishedPropertyAttachmentImage } from '@/utilities/optimaImage'
import { resolveCRMPropertyLocalizedTexts } from '@/utilities/localizedValue'

export type CRMListingPreset =
  | 'forSale'
  | 'sold'
  | 'featured'
  | 'seaView'
  | 'custom'
  | 'favorites'

export type PropertyListSort = 'newest' | 'priceDesc' | 'priceAsc'

export type PropertyListFilters = {
  reference?: string
  propertyType?: string[]
  /** Selected area (location) keys from CRM geo-data */
  location?: string[]
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  /** Listing status filters: `project` (new development), `resale` */
  status?: string[]
  /** View features: `sea views`, `mountain`, `golf` */
  features?: string[]
  deliveryDate?: string
  distanceToSea?: string
}

export type NormalizedListProperty = {
  id?: string
  imageUrl?: string
  isNewListing?: boolean
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  location: string
  reference?: string
  title: string
  propertyType?: string
  beds?: number
  baths?: number
  sqft?: number | string
  price: string
  priceValue?: number
  createdAt?: string
}

export type CRMFetchResult = {
  properties: Record<string, unknown>[]
  total: number
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate : fallback

const pickNumber = (candidate: unknown) => {
  if (typeof candidate === 'number') return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const isPriceOnDemandEnabled = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }
  return false
}

export const resolveCRMStatusBadgeLabel = (
  status: unknown,
): 'SOLD' | 'RESERVED' | undefined => {
  const normalizedStatus = pickString(status).toLowerCase()
  if (normalizedStatus === 'sold') return 'SOLD'
  if (normalizedStatus === 'under offer') return 'RESERVED'
  return undefined
}

/** Fixes common MongoDB paste patterns from admin (e.g. `{$ne: true}` → `{"$ne": true}`). */
export const normalizeCRMCustomQueryText = (raw: string): string => {
  let text = raw.trim()
  text = text.replace(/\{\s*(\$\w+)\s*:/g, '{"$1":')
  text = text.replace(/,\s*([}\]])/g, '$1')
  return text
}

export const parseCRMCustomQuery = (rawQuery: string): Record<string, unknown> | undefined => {
  const trimmedQuery = normalizeCRMCustomQueryText(rawQuery)
  if (!trimmedQuery) return undefined

  const parseCandidates = [trimmedQuery]
  if (!trimmedQuery.startsWith('{')) {
    parseCandidates.push(`{${trimmedQuery}}`)
  }

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue

      const asRecord = parsed as Record<string, unknown>
      const hasQueryContainer = asRecord.query && typeof asRecord.query === 'object'
      if (hasQueryContainer) return asRecord

      return { query: asRecord }
    } catch {
      // try next candidate
    }
  }

  return undefined
}

export const extractCRMList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )
  }

  if (payload && typeof payload === 'object') {
    const asRecord = payload as Record<string, unknown>
    const knownCollections = ['data', 'docs', 'results', 'items', 'commercial_properties']

    for (const key of knownCollections) {
      const value = asRecord[key]
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is Record<string, unknown> => !!item && typeof item === 'object',
        )
      }
    }
  }

  return []
}

export const extractCRMTotal = (payload: unknown, fallback: number): number => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fallback

  const asRecord = payload as Record<string, unknown>
  const candidates = [
    asRecord.total,
    asRecord.totalDocs,
    asRecord.totalCount,
    asRecord.count,
    (asRecord.meta as Record<string, unknown> | undefined)?.total,
    (asRecord.pagination as Record<string, unknown> | undefined)?.total,
  ]

  for (const candidate of candidates) {
    const n = pickNumber(candidate)
    if (n !== undefined && n >= 0) return n
  }

  return fallback
}

const parsePriceBound = (value?: string): string | undefined => {
  if (!value || value === 'any') return undefined
  const digits = value.replace(/[^\d]/g, '')
  return digits || undefined
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildReferenceOrQuery = (reference: string): Record<string, unknown>[] => {
  const trimmed = reference.trim()
  const regexPattern = `.*${escapeRegex(trimmed)}.*`

  return [
    { reference: trimmed },
    { other_reference: { $regex: regexPattern, $options: 'i' } },
    { external_reference: { $regex: regexPattern, $options: 'i' } },
  ]
}

/**
 * Merge CRM query objects. Simple fields (sale, status, location, …) stay at the top level.
 * `$and` / `$or` / `$nor` are preserved as `$and` entries so status filters match live CRM:
 * `{ sale: true, $and: [{ $or: [ …resale… ] }] }` — not a top-level `$or`.
 */
export const mergeCRMQueryObjects = (
  ...sources: Record<string, unknown>[]
): Record<string, unknown> => {
  const merged: Record<string, unknown> = {}
  const andItems: Record<string, unknown>[] = []

  const appendAndItems = (items: unknown) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        andItems.push(item as Record<string, unknown>)
      }
    }
  }

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue

    for (const [key, value] of Object.entries(source)) {
      if (key === '$and') {
        appendAndItems(value)
        continue
      }

      if (key === '$or') {
        andItems.push({ $or: value })
        continue
      }

      if (key === '$nor') {
        andItems.push({ $nor: value })
        continue
      }

      merged[key] = value
    }
  }

  if (andItems.length > 0) {
    merged.$and = andItems
  }

  return merged
}

const buildSinglePropertyListingStatusQuery = (
  status: string,
): Record<string, unknown> | null => {
  if (status === 'project') {
    return {
      $or: [{ project: true }, { 'categories.new_construction': true }],
    }
  }

  if (status === 'resale') {
    return {
      $or: [
        {
          $and: [{ project: { $ne: true } }, { 'categories.new_construction': false }],
        },
        { 'categories.resale': true },
      ],
    }
  }

  return null
}

const formatCRMDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfToday = (): Date => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const addMonthsToDate = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const buildYearBuiltDeliveryQuery = (lteDate: string): Record<string, unknown> => ({
  year_built: {
    $exists: true,
    $nin: ['', null],
    $lte: lteDate,
  },
})

/** Delivery / handover filter — `year_built.$lte` is computed from today + option months. */
export const buildPropertyListingDeliveryQuery = (
  deliveryDate?: string,
): Record<string, unknown> | null => {
  const value = deliveryDate?.trim()
  if (!value || value === 'any') return null

  const today = startOfToday()
  let lteDate: string | null = null

  switch (value) {
    case '1':
      lteDate = formatCRMDate(today)
      break
    case '3':
      lteDate = formatCRMDate(addMonthsToDate(today, 3))
      break
    case '6':
      lteDate = formatCRMDate(addMonthsToDate(today, 6))
      break
    case '12':
      lteDate = formatCRMDate(addMonthsToDate(today, 12))
      break
    case '18':
      lteDate = formatCRMDate(addMonthsToDate(today, 18))
      break
    case '60':
      lteDate = formatCRMDate(addMonthsToDate(today, -18))
      break
    default:
      return null
  }

  return buildYearBuiltDeliveryQuery(lteDate)
}

/** `1000000` = indifferent (no distance filter). */
export const PROPERTY_LISTING_DISTANCE_INDIFFERENT = '1000000'

/**
 * Distance to sea — CRM matches km or meters:
 * `$and: [{ $or: [{ distances.sea.value/$lte + unit km }, { … unit meters }] }]`
 */
export const buildPropertyListingDistanceQuery = (
  distanceToSea?: string,
): Record<string, unknown> | null => {
  const value = distanceToSea?.trim()
  if (!value || value === 'any' || value === PROPERTY_LISTING_DISTANCE_INDIFFERENT) {
    return null
  }

  const meters = parseInt(value.replace(/\D/g, ''), 10)
  if (!Number.isFinite(meters) || meters <= 0) return null

  const km = meters / 1000

  return {
    $or: [
      {
        'distances.sea.value': { $lte: km },
        'distances.sea.unit': 'km',
      },
      {
        'distances.sea.value': { $lte: String(meters) },
        'distances.sea.unit': 'meters',
      },
    ],
  }
}

export const PROPERTY_LISTING_STATUS_VALUES = ['project', 'resale'] as const

export const PROPERTY_LISTING_FEATURE_VALUES = ['sea views', 'mountain', 'golf'] as const

const buildSinglePropertyListingFeatureQuery = (
  feature: string,
): Record<string, unknown> | null => {
  switch (feature) {
    case 'sea views':
      return { 'views.sea': true }
    case 'mountain':
      return { 'views.mountain': true }
    case 'golf':
      return { 'views.golf': true }
    default:
      return null
  }
}

/**
 * View feature filters (multi-select).
 * Live CRM: `$and: [{ $or: [{ views.sea: true }, { views.mountain: true }, …] }]`
 */
export const buildPropertyListingFeatureQuery = (
  features?: string | string[],
): Record<string, unknown> | null => {
  const values = Array.from(
    new Set(
      (Array.isArray(features)
        ? features.filter((item) => item && item !== 'any')
        : features && features !== 'any'
          ? [features]
          : []
      ).filter((item) =>
        (PROPERTY_LISTING_FEATURE_VALUES as readonly string[]).includes(item),
      ),
    ),
  )

  if (values.length === 0) return null

  const orItems = values
    .map((value) => buildSinglePropertyListingFeatureQuery(value))
    .filter((clause): clause is Record<string, unknown> => clause !== null)

  if (orItems.length === 0) return null
  return { $or: orItems }
}

/** New development / resale filters for the property list Status field (multi-select). */
export const buildPropertyListingStatusQuery = (
  status?: string | string[],
): Record<string, unknown> | null => {
  const values = Array.from(
    new Set(
      (Array.isArray(status)
        ? status.filter((item) => item && item !== 'any')
        : status && status !== 'any'
          ? [status]
          : []
      ).filter((item) =>
        (PROPERTY_LISTING_STATUS_VALUES as readonly string[]).includes(item),
      ),
    ),
  )

  // Both selected = same as none selected (do not send status constraints)
  if (values.length >= PROPERTY_LISTING_STATUS_VALUES.length) return null

  const clauses = values
    .map((value) => buildSinglePropertyListingStatusQuery(value))
    .filter((clause): clause is Record<string, unknown> => clause !== null)

  if (clauses.length === 0) return null
  return clauses[0]
}

export const buildFilterQuery = (filters: PropertyListFilters): Record<string, unknown> => {
  const query: Record<string, unknown> = {}
  const andClauses: Record<string, unknown>[] = []
  const orGroups: Record<string, unknown>[][] = []

  if (filters.reference?.trim()) {
    orGroups.push(buildReferenceOrQuery(filters.reference))
  }

  if (filters.propertyType?.length) {
    const typeKeys = filters.propertyType
      .map((value) => Number(value))
      .filter((key) => Number.isFinite(key))

    if (typeKeys.length > 0) {
      query.type_one = { $in: typeKeys }
    }
  }

  const locationKeys = (filters.location ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))

  if (locationKeys.length > 0) {
    query.location = { $in: locationKeys }
  }

  const statusClause = buildPropertyListingStatusQuery(filters.status)
  if (statusClause) andClauses.push(statusClause)

  const featureClause = buildPropertyListingFeatureQuery(filters.features)
  if (featureClause) andClauses.push(featureClause)

  const distanceClause = buildPropertyListingDistanceQuery(filters.distanceToSea)
  if (distanceClause) andClauses.push(distanceClause)

  for (const group of orGroups) {
    andClauses.push({ $or: group })
  }

  const hasLogicalClause = Boolean(statusClause || featureClause || distanceClause)
  if (andClauses.length === 1 && orGroups.length === 1 && !hasLogicalClause) {
    query.$or = orGroups[0]
  } else if (andClauses.length > 0) {
    query.$and = andClauses
  }

  const minPrice = parsePriceBound(filters.minPrice)
  const maxPrice = parsePriceBound(filters.maxPrice)
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceQuery: Record<string, string> = {}
    if (minPrice !== undefined) priceQuery.$gte = minPrice
    if (maxPrice !== undefined) priceQuery.$lte = maxPrice
    query.current_price = priceQuery
  }

  if (filters.bedrooms && filters.bedrooms !== 'any') {
    const minBeds = parseInt(filters.bedrooms.replace(/\D/g, ''), 10)
    if (Number.isFinite(minBeds)) {
      query.bedrooms = { $gte: minBeds }
    }
  }

  const deliveryQuery = buildPropertyListingDeliveryQuery(filters.deliveryDate)
  if (deliveryQuery) Object.assign(query, deliveryQuery)

  return query
}

/** CRM pagination — matches PHP: options.page + options.limit */
export const buildCRMPageOptions = (page: number, limit: number): Record<string, number> => ({
  page: Math.max(1, page),
  limit: Math.max(1, limit),
})

/** Restrict listing to favorited property IDs (supports CRM `_id` and numeric `id`). */
export const buildFavoriteIdsClause = (
  ids: (string | number)[],
): Record<string, unknown> | null => {
  if (!ids.length) return null

  const stringIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))]
  const numericIds = [
    ...new Set(
      ids
        .map((id) => (typeof id === 'number' ? id : Number(id)))
        .filter((n) => Number.isFinite(n)),
    ),
  ]

  const orClauses: Record<string, unknown>[] = []
  if (stringIds.length) orClauses.push({ _id: { $in: stringIds } })
  if (numericIds.length) orClauses.push({ id: { $in: numericIds } })

  if (!orClauses.length) return null
  if (orClauses.length === 1) return orClauses[0]
  return { $or: orClauses }
}

export const buildCRMListingQuery = ({
  preset,
  crmQueryJson,
  page,
  pageSize,
  filters = {},
  restrictToFavoriteIds,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  page: number
  pageSize: number
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
}): Record<string, unknown> => {
  const paginationOptions = buildCRMPageOptions(page, pageSize)
  const filterQuery = buildFilterQuery(filters)

  if (preset === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
    const parsedQuery = parseCRMCustomQuery(crmQueryJson)
    if (parsedQuery) {
      const parsedOptions =
        parsedQuery.options && typeof parsedQuery.options === 'object'
          ? (parsedQuery.options as Record<string, unknown>)
          : {}
      const baseQuery =
        parsedQuery.query && typeof parsedQuery.query === 'object'
          ? (parsedQuery.query as Record<string, unknown>)
          : {}

      const mergedQuery = mergeCRMQueryObjects(baseQuery, filterQuery)

      const restOptions = { ...parsedOptions }
      delete restOptions.skip

      return {
        ...parsedQuery,
        options: {
          ...restOptions,
          ...paginationOptions,
        },
        query: mergedQuery,
      }
    }

    console.error(
      'Invalid CRM custom query JSON on property list. Use valid JSON (e.g. {"$ne": true} not {$ne: true}).',
      crmQueryJson,
    )
    return {
      options: paginationOptions,
      query: {},
    }
  }

  let baseQuery: Record<string, unknown> = {
    similar_commercials: 'include_similar',
    sale: true,
  }

  if (preset === 'sold') {
    baseQuery = {
      similar_commercials: 'include_similar',
      sale: true,
      status: { $in: ['Sold'] },
    }
  } else if (preset === 'forSale') {
    baseQuery = {
      similar_commercials: 'include_similar',
      sale: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'seaView') {
    baseQuery = {
      similar_commercials: 'include_similar',
      sale: true,
      status: { $in: ['Available', 'Under Offer'] },
      'views.sea': true,
    }
  } else if (preset === 'featured') {
    baseQuery = {
      similar_commercials: 'include_similar',
      sale: true,
      featured: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'favorites') {
    baseQuery = {
      similar_commercials: 'include_similar',
    }
  }

  let mergedQuery = mergeCRMQueryObjects(baseQuery, filterQuery)

  if (preset === 'favorites' && restrictToFavoriteIds?.length) {
    const favoriteClause = buildFavoriteIdsClause(restrictToFavoriteIds)
    if (favoriteClause) {
      mergedQuery = mergeCRMQueryObjects(mergedQuery, favoriteClause)
    }
  }

  return {
    options: paginationOptions,
    query: mergedQuery,
  }
}

export type NormalizeCRMPropertyOptions = {
  /** Formats price as "399,000 €" instead of "€399,000" */
  currencySymbolAfter?: boolean
  /** When true, leaves price empty if CRM has no price (Properties carousel). */
  emptyPriceWhenMissing?: boolean
}

export type NormalizedCRMProperty = NormalizedListProperty & {
  description?: string
  city?: string
  region?: string
  propertySubtype?: string
}

export function normalizeCRMProperty(
  property: Record<string, unknown>,
  locale: string,
  options: NormalizeCRMPropertyOptions = {},
): NormalizedCRMProperty {
  const propertyAttachments = Array.isArray(property.property_attachments)
    ? property.property_attachments
    : []
  const images = Array.isArray(property.images) ? property.images : []
  const firstImage = images.find(
    (image): image is Record<string, unknown> => !!image && typeof image === 'object',
  )
  const imageUrl =
    getPublishedPropertyAttachmentImage(propertyAttachments, 1000) ||
    pickString(firstImage?.url) ||
    pickString(firstImage?.full) ||
    pickString(firstImage?.large) ||
    pickString(firstImage?.medium) ||
    pickString(firstImage?.small) ||
    pickString(property.main_image) ||
    pickString(property.image)

  const localized = resolveCRMPropertyLocalizedTexts(property, locale)

  const propertyTitle =
    localized.title ||
    pickString(property.display_name) ||
    pickString(property.name) ||
    localized.propertyType ||
    'Property'

  const beds = pickNumber(property.bedrooms) ?? pickNumber(property.beds)
  const baths = pickNumber(property.bathrooms) ?? pickNumber(property.baths)
  const size =
    pickNumber(property.built) ??
    pickNumber(property.m2_built) ??
    pickNumber(property.covered_area) ??
    pickNumber(property.internal_area) ??
    pickNumber(property.sqft)
  const dimensions = pickString(property.dimensions, 'Metres')
  const sizeWithUnit = size
    ? `${size}${dimensions === 'Metres' ? 'm²' : 'ft²'}`
    : options.currencySymbolAfter
      ? `0${dimensions === 'Metres' ? 'm²' : 'ft²'}`
      : undefined

  const rawPrice =
    property.price ?? property.current_price ?? property.sale_price ?? property.list_price
  const hasPriceOnDemand = isPriceOnDemandEnabled(property.price_on_demand)
  const priceValue = typeof rawPrice === 'number' ? rawPrice : pickNumber(rawPrice)
  const formattedRawPrice =
    typeof rawPrice === 'number'
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rawPrice)
      : pickString(rawPrice)

  let resolvedPrice = options.emptyPriceWhenMissing ? '' : 'Price on request'
  if (hasPriceOnDemand) {
    resolvedPrice = 'Price on demand'
  } else if (formattedRawPrice) {
    resolvedPrice = options.currencySymbolAfter
      ? `${formattedRawPrice} €`
      : `€${formattedRawPrice}`
  }

  const referenceRaw = property.reference
  const reference =
    typeof referenceRaw === 'number' ? String(referenceRaw) : pickString(referenceRaw)
  const statusBadgeLabel = resolveCRMStatusBadgeLabel(property.status)
  const id = pickString(property._id) || pickString(property.id)

  return {
    id,
    imageUrl,
    isNewListing: Boolean(property.featured),
    statusBadgeLabel,
    location: localized.location || 'Greece',
    city: localized.city || undefined,
    region: localized.region || undefined,
    reference,
    title: propertyTitle,
    description: localized.description || undefined,
    propertyType: localized.propertyType || undefined,
    propertySubtype: localized.propertySubtype || undefined,
    beds,
    baths,
    sqft: sizeWithUnit,
    price: resolvedPrice,
    priceValue,
    createdAt: pickString(property.created_at) || pickString(property.createdAt),
  }
}

export const normalizeCRMListProperty = (
  property: Record<string, unknown>,
  locale: string,
): NormalizedListProperty => normalizeCRMProperty(property, locale)

export const sortProperties = (
  properties: NormalizedListProperty[],
  sort: PropertyListSort,
): NormalizedListProperty[] => {
  const copy = [...properties]

  if (sort === 'priceDesc') {
    return copy.sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0))
  }
  if (sort === 'priceAsc') {
    return copy.sort((a, b) => (a.priceValue ?? 0) - (b.priceValue ?? 0))
  }

  return copy.sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return bTime - aTime
  })
}

/** Same direct CRM call as the home page Properties block (NEXT_PUBLIC_CRM_API_URL). */
export async function fetchCRMProperties({
  body,
  signal,
}: {
  body: Record<string, unknown>
  signal?: AbortSignal
}): Promise<CRMFetchResult> {
  const response = await postToCRM('commercial_properties', body, { signal })

  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  return { properties: list, total }
}
