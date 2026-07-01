import { getFromCRM } from '@/utilities/crmApi'
import { crmListingBodyToSearchParams } from '@/utilities/crmPropertiesGetParams'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import {
  getPublishedPropertyAttachmentImage,
  getPublishedPropertyAttachmentImages,
  PROPERTY_CARD_IMAGE_SIZE,
  PROPERTY_DETAIL_IMAGE_SIZE,
} from '@/utilities/optimaImage'
import { resolveCRMPropertyLocalizedTexts } from '@/utilities/localizedValue'
import {
  resolvePropertyDetailHref,
  resolvePropertyListingMode,
  type PropertyListingMode,
} from '@/utilities/propertyUrl'

export type CRMListingPreset =
  | 'forSale'
  | 'forRent'
  | 'sold'
  | 'featured'
  | 'seaView'
  | 'custom'
  | 'favorites'

export type PropertyListSort = string

export type PropertyListFilters = {
  reference?: string
  propertyType?: string[]
  /** Selected coast (location group) key_system values */
  coast?: string[]
  /** Selected city keys from CRM */
  city?: string[]
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  /** Listing status filters: `project` (new development), `resale` */
  status?: string[]
  /** View features: `sea views`, `mountain`, `golf` */
  features?: string[]
  deliveryDate?: string
  distanceToSea?: string
  /** Property references selected via map polygon draw */
  mapReferences?: string[]
}

export type NormalizedListProperty = {
  id?: string
  imageUrl?: string
  /** All CRM attachment image URLs (ordered); used for card image slider */
  imageUrls?: string[]
  isNewListing?: boolean
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  location: string
  city?: string
  reference?: string
  /** Site path e.g. `/property-details/luxury-villa-in-calpe_618268` */
  detailHref?: string
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

export const resolveCRMStatusBadgeLabel = (status: unknown): 'SOLD' | 'RESERVED' | undefined => {
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

/** Uses global Optima CRM setting when the query omits similar_commercials. */
export const withSimilarCommercialsDefault = (
  query: Record<string, unknown>,
): Record<string, unknown> => {
  if ('similar_commercials' in query) return query
  return { ...query, ...getSimilarCommercialsQuery() }
}

/** Coordinate filters for CRM property queries (matches Optima PHP commercial_properties presets). */
export const CRM_COORDINATE_QUERY_FIELDS = {
  latitude: { $exists: true, $ne: '' },
  longitude: { $exists: true, $ne: '' },
} as const

export const withCRMCoordinateQueryFields = (
  query: Record<string, unknown>,
): Record<string, unknown> => ({
  ...query,
  ...CRM_COORDINATE_QUERY_FIELDS,
})

/** Parses admin sort JSON (e.g. `{"created_at": -1}` or `{"updated_at": true}`). */
export const parseCRMSortParams = (raw: string): Record<string, unknown> | undefined => {
  const trimmed = normalizeCRMCustomQueryText(raw)
  if (!trimmed) return undefined

  const candidates = [trimmed]
  if (!trimmed.startsWith('{')) {
    candidates.push(`{${trimmed}}`)
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
      return parsed as Record<string, unknown>
    } catch {
      // try next candidate
    }
  }

  return undefined
}

const mergeCRMListingOptions = (
  base: Record<string, unknown>,
  sortParams?: Record<string, unknown>,
): Record<string, unknown> => {
  if (!sortParams || !Object.keys(sortParams).length) return base

  return {
    ...base,
    sort: sortParams,
  }
}

const hasCRMPropertyIdentity = (record: Record<string, unknown>): boolean =>
  record._id != null || record.reference != null

/** Optima property listings prepend `{ pagination: { total } }` as the first array item. */
const isCRMPaginationMetaRow = (record: Record<string, unknown>): boolean =>
  record.pagination != null &&
  typeof record.pagination === 'object' &&
  !hasCRMPropertyIdentity(record)

const isCRMListRow = (item: unknown): item is Record<string, unknown> =>
  !!item && typeof item === 'object' && !isCRMPaginationMetaRow(item as Record<string, unknown>)

export const extractCRMList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isCRMListRow)
  }

  if (payload && typeof payload === 'object') {
    const asRecord = payload as Record<string, unknown>
    const knownCollections = [
      'data',
      'docs',
      'results',
      'items',
      'commercial_properties',
      'properties',
    ]

    for (const key of knownCollections) {
      const value = asRecord[key]
      if (Array.isArray(value)) {
        return value.filter(isCRMListRow)
      }
    }
  }

  return []
}

export const extractCRMTotal = (payload: unknown, fallback: number): number => {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>

      const paginationTotal = pickNumber(
        (record.pagination as Record<string, unknown> | undefined)?.total,
      )
      if (paginationTotal !== undefined && paginationTotal >= 0) return paginationTotal

      const totalProperties = pickNumber(record.total_properties)
      if (totalProperties !== undefined && totalProperties >= 0) return totalProperties
    }

    return fallback
  }

  if (!payload || typeof payload !== 'object') return fallback

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

/**
 * Optima detail/view responses wrap the record as `{ property, attachments, ... }`.
 * Listing items are usually flat. Unwrap so downstream code reads `description`, `title`, etc.
 */
export const unwrapCRMPropertyRecord = (
  record: Record<string, unknown>,
): Record<string, unknown> => {
  const nested = record.property
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return record

  const inner = nested as Record<string, unknown>
  if (!hasCRMPropertyIdentity(inner) || hasCRMPropertyIdentity(record)) return record

  const unwrapped: Record<string, unknown> = { ...inner }

  const topAttachments = record.attachments ?? record.property_attachments
  if (Array.isArray(topAttachments) && topAttachments.length > 0) {
    const existing = Array.isArray(unwrapped.property_attachments)
      ? unwrapped.property_attachments
      : []
    if (existing.length === 0) {
      unwrapped.property_attachments = topAttachments
    }
  }

  if (record.featured !== undefined && unwrapped.featured === undefined) {
    unwrapped.featured = record.featured
  }

  return unwrapped
}

const parsePriceBound = (value?: string): string | undefined => {
  if (!value || value === 'any') return undefined
  const digits = value.replace(/[^\d]/g, '')
  return digits || undefined
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildReferenceOrQuery = (
  reference: string,
  referenceAsNumber = false,
): Record<string, unknown>[] => {
  const trimmed = reference.trim()
  const regexPattern = `.*${escapeRegex(trimmed)}.*`
  const numericRef = Number(trimmed)
  const referenceValue = referenceAsNumber && Number.isFinite(numericRef) ? numericRef : trimmed

  return [
    { reference: referenceValue },
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

const buildSinglePropertyListingStatusQuery = (status: string): Record<string, unknown> | null => {
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
      ).filter((item) => (PROPERTY_LISTING_FEATURE_VALUES as readonly string[]).includes(item)),
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
      ).filter((item) => (PROPERTY_LISTING_STATUS_VALUES as readonly string[]).includes(item)),
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

export type BuildFilterQueryOptions = {
  /** find-all expects numeric `reference` values; default listing API uses strings */
  referenceAsNumber?: boolean
}

export const buildFilterQuery = (
  filters: PropertyListFilters,
  options: BuildFilterQueryOptions = {},
): Record<string, unknown> => {
  const { referenceAsNumber = false } = options
  const query: Record<string, unknown> = {}
  const andClauses: Record<string, unknown>[] = []
  const orGroups: Record<string, unknown>[][] = []

  if (filters.mapReferences?.length) {
    const refs = [...new Set(filters.mapReferences.map((ref) => ref.trim()).filter(Boolean))]
    const numericRefs = refs.map((ref) => Number(ref)).filter((value) => Number.isFinite(value))
    const stringRefs = refs.filter((ref) => !Number.isFinite(Number(ref)))

    const orClauses: Record<string, unknown>[] = []
    if (numericRefs.length) orClauses.push({ reference: { $in: numericRefs } })
    if (stringRefs.length) orClauses.push({ reference: { $in: stringRefs } })

    if (orClauses.length === 1) {
      Object.assign(query, orClauses[0])
    } else if (orClauses.length > 1) {
      andClauses.push({ $or: orClauses })
    }
  } else if (filters.reference?.trim()) {
    orGroups.push(buildReferenceOrQuery(filters.reference, referenceAsNumber))
  }

  if (filters.propertyType?.length) {
    const typeKeys = filters.propertyType
      .map((value) => Number(value))
      .filter((key) => Number.isFinite(key))

    if (typeKeys.length > 0) {
      query.type_one = { $in: typeKeys }
    }
  }

  // Match gestali-home CommercialPropertiesNew::setQuery — coast uses lg_by_key, not location_group.
  const coastKeys = (filters.coast ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))

  if (coastKeys.length > 0) {
    query.lg_by_key = { $in: coastKeys }
  }

  const cityKeys = (filters.city ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))

  if (cityKeys.length > 0) {
    query.city = { $in: cityKeys }
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
      ids.map((id) => (typeof id === 'number' ? id : Number(id))).filter((n) => Number.isFinite(n)),
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
  sortParams,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  page: number
  pageSize: number
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  sortParams?: Record<string, unknown>
}): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()
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

      const mergedQuery = withSimilarCommercialsDefault(
        mergeCRMQueryObjects({ remove_count: true }, baseQuery, filterQuery),
      )

      const restOptions = { ...parsedOptions }
      delete restOptions.skip

      return {
        ...parsedQuery,
        options: mergeCRMListingOptions(
          {
            ...restOptions,
            ...paginationOptions,
          },
          sortParams,
        ),
        query: mergedQuery,
      }
    }

    console.error(
      'Invalid CRM custom query JSON on property list. Use valid JSON (e.g. {"$ne": true} not {$ne: true}).',
      crmQueryJson,
    )
    return {
      options: mergeCRMListingOptions(paginationOptions, sortParams),
      query: withSimilarCommercialsDefault({ remove_count: true }),
    }
  }

  let baseQuery: Record<string, unknown> = {
    ...similarCommercials,
    archived: { $ne: true },
    sale: true,
    remove_count: true,
    has_images: true,
  }

  if (preset === 'sold') {
    baseQuery = {
      ...similarCommercials,
      remove_count: true,
      status: { $in: ['Sold'] },
    }
  } else if (preset === 'forSale') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      remove_count: true,
      status: { $in: ['Available', 'Under Offer','Sold'] },
    }
  } else if (preset === 'forRent') {
    baseQuery = {
      ...similarCommercials,
      rent: true,
      remove_count: true,
      archived: { $ne: true },
      has_images: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'seaView') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      remove_count: true,
      status: { $in: ['Available', 'Under Offer'] },
      views: ['sea'],
    }
  } else if (preset === 'featured') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      featured: true,
      remove_count: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'favorites') {
    baseQuery = {
      ...similarCommercials,
      remove_count: true,
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
    options: mergeCRMListingOptions(paginationOptions, sortParams),
    query: mergedQuery,
  }
}

export type NormalizeCRMPropertyOptions = {
  /** Formats price as "399,000 €" instead of "€399,000" */
  currencySymbolAfter?: boolean
  /** When true, leaves price empty if CRM has no price (Properties carousel). */
  emptyPriceWhenMissing?: boolean
  /** Optima resize segment in attachment URLs (cards: 500, detail: 1000). */
  attachmentImageSize?: number
  /** Optional cap on gallery URLs for list/card views (detail pages omit this). */
  maxGalleryImages?: number
  /** Sale vs rent URL map — defaults from CRM `sale` / `rent` flags. */
  listingMode?: PropertyListingMode
}

export const resolveListingModeFromPreset = (preset: CRMListingPreset): PropertyListingMode =>
  preset === 'forRent' ? 'rent' : 'sale'

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
  property = unwrapCRMPropertyRecord(property)

  const propertyAttachments = Array.isArray(property.property_attachments)
    ? property.property_attachments
    : Array.isArray(property.attachments)
      ? property.attachments
      : []
  const images = Array.isArray(property.images) ? property.images : []

  const imageSize = options.attachmentImageSize ?? PROPERTY_DETAIL_IMAGE_SIZE
  const attachmentImageUrls = getPublishedPropertyAttachmentImages(propertyAttachments, imageSize)

  const legacyImageUrls = images
    .filter((image): image is Record<string, unknown> => !!image && typeof image === 'object')
    .map(
      (image) =>
        pickString(image.url) ||
        pickString(image.full) ||
        pickString(image.large) ||
        pickString(image.medium) ||
        pickString(image.small),
    )
    .filter((url) => Boolean(url))

  const fallbackImageUrl = pickString(property.main_image) || pickString(property.image)

  let imageUrls =
    attachmentImageUrls.length > 0
      ? attachmentImageUrls
      : legacyImageUrls.length > 0
        ? legacyImageUrls
        : fallbackImageUrl
          ? [fallbackImageUrl]
          : []

  if (options.maxGalleryImages && options.maxGalleryImages > 0) {
    imageUrls = imageUrls.slice(0, options.maxGalleryImages)
  }

  const imageUrl =
    imageUrls[0] ||
    getPublishedPropertyAttachmentImage(propertyAttachments, imageSize) ||
    legacyImageUrls[0] ||
    fallbackImageUrl

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
    resolvedPrice = options.currencySymbolAfter ? `${formattedRawPrice} €` : `€${formattedRawPrice}`
  }

  const referenceRaw = property.reference
  const reference =
    typeof referenceRaw === 'number' ? String(referenceRaw) : pickString(referenceRaw)
  const statusBadgeLabel = resolveCRMStatusBadgeLabel(property.status)
  const id = pickString(property._id) || pickString(property.id)

  return {
    id,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    isNewListing: Boolean(property.featured),
    statusBadgeLabel,
    location: localized.location || 'Greece',
    city: localized.city || undefined,
    region: localized.region || undefined,
    reference,
    detailHref: resolvePropertyDetailHref(property, locale, {
      listingMode: options.listingMode ?? resolvePropertyListingMode(property),
    }),
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
  options: NormalizeCRMPropertyOptions = {},
): NormalizedListProperty =>
  normalizeCRMProperty(property, locale, {
    attachmentImageSize: PROPERTY_CARD_IMAGE_SIZE,
    ...options,
  })

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

/** GET /v3/properties/ using credentials from Globals → Optima CRM. */
export async function fetchCRMProperties({
  body,
  signal,
}: {
  body: Record<string, unknown>
  signal?: AbortSignal
}): Promise<CRMFetchResult> {
  const searchParams = crmListingBodyToSearchParams(body)
  const response = await getFromCRM('properties', searchParams, { signal })

  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  return { properties: list, total }
}
