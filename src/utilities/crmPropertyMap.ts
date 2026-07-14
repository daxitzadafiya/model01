/**
 * Optima CRM map markers — calls find-all directly from the browser (same as PHP).
 * Credentials are loaded from Globals → Optima CRM on the server and seeded in the root layout.
 */
import { getSimilarCommercialsQuery, resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'
import {
  buildFavoriteIdsClause,
  buildFilterQuery,
  CRM_PROPERTY_ATTACHMENTS_POPULATE,
  extractCRMList,
  extractCRMTotal,
  mergeCRMQueryObjects,
  parseCRMCustomQuery,
  withSimilarCommercialsDefault,
  withCRMCoordinateQueryFields,
  type CRMListingPreset,
  type PropertyListFilters,
} from '@/utilities/crmProperties'

const MAP_AVAILABLE_STATUSES = ['Available', 'Under Offer'] as const
const MAP_SOLD_STATUSES = ['Sold'] as const

export type MapPropertyPoint = {
  id: string
  reference: string
  lat: number
  lng: number
}

function getCRMMapConfig(): { apiUrl: string; userKey: string } | null {
  const settings = resolveOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const userKey = settings.userKey.trim()

  if (!apiUrl || !userKey) return null

  return { apiUrl, userKey }
}

const pickCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export const normalizeMapPropertyPoint = (
  raw: Record<string, unknown>,
): MapPropertyPoint | null => {
  const lat = pickCoordinate(raw.latitude)
  const lng = pickCoordinate(raw.longitude)

  if (lat === null || lng === null) return null
  if (lat === 0 && lng === 0) return null

  const id = typeof raw._id === 'string' && raw._id.trim() ? raw._id.trim() : undefined
  const referenceRaw = raw.reference ?? raw.id
  const reference =
    typeof referenceRaw === 'number'
      ? String(referenceRaw)
      : typeof referenceRaw === 'string' && referenceRaw.trim()
        ? referenceRaw.trim()
        : undefined

  if (!id && !reference) return null

  return {
    id: id ?? reference!,
    reference: reference ?? id!,
    lat,
    lng,
  }
}

export { CRM_PROPERTY_ATTACHMENTS_POPULATE as MAP_FIND_ALL_POPULATE } from '@/utilities/crmProperties'

/** CRM find-all pagination + sort + populate — matches Optima map API expectations. */
export const buildCRMMapOptions = (
  page: number,
  limit: number,
  sortParams?: Record<string, unknown>,
): Record<string, unknown> => ({
  page: Math.max(1, page),
  limit: Math.max(1, limit),
  sort:
    sortParams && Object.keys(sortParams).length > 0
      ? sortParams
      : {
          current_price: '-1',
        },
  populate: CRM_PROPERTY_ATTACHMENTS_POPULATE,
})

const buildCRMMapBaseQuery = (preset: CRMListingPreset): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()

  if (preset === 'sold') {
    return {
      ...similarCommercials,
      sale: true,
      archived: { $ne: true },
      // has_images: true,
      status: { $in: [...MAP_SOLD_STATUSES] },
    }
  }

  if (preset === 'forRent') {
    return {
      ...similarCommercials,
      rent: true,
      lt_rental: true,
      status: { $in: [...MAP_AVAILABLE_STATUSES] },
    }
  }

  if (preset === 'forHoliday') {
    return {
      ...similarCommercials,
      rent: true,
      st_rental: true,
      status: { $in: [...MAP_AVAILABLE_STATUSES] },
    }
  }

  if (preset === 'favorites') {
    return {
      ...similarCommercials,
      archived: { $ne: true },
      // has_images: true,
    }
  }

  const baseQuery: Record<string, unknown> = {
    ...similarCommercials,
    sale: true,
    archived: { $ne: true },
    // has_images: true,
    status: { $in: [...MAP_AVAILABLE_STATUSES] },
  }

  if (preset === 'seaView') {
    baseQuery['views.sea'] = true
  } else if (preset === 'featured') {
    baseQuery.featured = true
  }

  return baseQuery
}

/** find-all must not send remove_count; core query fields always enforced per preset. */
export const normalizeMapFindAllQuery = (
  query: Record<string, unknown>,
  preset: CRMListingPreset,
): Record<string, unknown> => {
  const { remove_count: _removeCount, ...rest } = query

  const normalized: Record<string, unknown> = withCRMCoordinateQueryFields(
    withSimilarCommercialsDefault({
      ...rest,
      archived: { $ne: true },
      // has_images: true,
    }),
  )

  if (preset !== 'favorites') {
    if (preset === 'forRent') {
      normalized.rent = true
      normalized.lt_rental = true
      delete normalized.sale
      delete normalized.st_rental
    } else if (preset === 'forHoliday') {
      normalized.rent = true
      normalized.st_rental = true
      delete normalized.sale
    } else {
      normalized.sale = true
    }
  }

  if (preset === 'sold') {
    normalized.status = { $in: [...MAP_SOLD_STATUSES] }
  } else if (preset === 'custom' || preset === 'favorites') {
    if (!normalized.status) {
      normalized.status = { $in: [...MAP_AVAILABLE_STATUSES] }
    }
  } else {
    normalized.status = { $in: [...MAP_AVAILABLE_STATUSES] }
  }

  normalized.frontend_api = true

  return normalized
}

export const buildCRMMapQuery = ({
  preset,
  crmQueryJson,
  filters = {},
  restrictToFavoriteIds,
  page,
  pageSize,
  sortParams,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  page: number
  pageSize: number
  sortParams?: Record<string, unknown>
}): Record<string, unknown> => {
  let baseQuery = buildCRMMapBaseQuery(preset)

  if (preset === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
    const parsedQuery = parseCRMCustomQuery(crmQueryJson)
    const parsedBase =
      parsedQuery?.query && typeof parsedQuery.query === 'object'
        ? (parsedQuery.query as Record<string, unknown>)
        : null

    if (parsedBase) {
      baseQuery = mergeCRMQueryObjects(
        {
          ...getSimilarCommercialsQuery(),
          sale: true,
          archived: { $ne: true },
          // has_images: true,
        },
        parsedBase,
      )
    }
  }

  let query = mergeCRMQueryObjects(
    baseQuery,
    buildFilterQuery(filters, { referenceAsNumber: true, includeMapReferences: true }),
  )

  if (preset === 'favorites' && restrictToFavoriteIds?.length) {
    const favoriteClause = buildFavoriteIdsClause(restrictToFavoriteIds)
    if (favoriteClause) {
      query = mergeCRMQueryObjects(query, favoriteClause)
    }
  }

  return {
    options: buildCRMMapOptions(page, pageSize, sortParams),
    query: normalizeMapFindAllQuery(query, preset),
  }
}

export async function fetchCRMMapProperties({
  preset,
  crmQueryJson,
  filters = {},
  restrictToFavoriteIds,
  pageSize = 10,
  signal,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  pageSize?: number
  signal?: AbortSignal
}): Promise<{ properties: MapPropertyPoint[]; total: number }> {
  const config = getCRMMapConfig()
  if (!config) {
    throw new Error('Optima CRM map config is missing (apiUrl and userKey required)')
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, '')
  const endpoint = `${baseUrl}/commercial_properties/find-all?user=${encodeURIComponent(config.userKey)}&latLang=1&selectedFields=1`

  const allPoints: MapPropertyPoint[] = []
  const seen = new Set<string>()
  let page = 1
  let total = 0
  let hasMore = true

  while (hasMore) {
    const body = buildCRMMapQuery({
      preset,
      crmQueryJson,
      filters,
      restrictToFavoriteIds,
      page,
      pageSize,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`CRM map API failed (${response.status})`)
    }

    const data = (await response.json()) as unknown
    const list = extractCRMList(data)
    total = extractCRMTotal(data, list.length)

    for (const item of list) {
      const point = normalizeMapPropertyPoint(item)
      if (!point) continue

      const key = `${point.id}:${point.reference}`
      if (seen.has(key)) continue
      seen.add(key)
      allPoints.push(point)
    }

    if (list.length < pageSize || allPoints.length >= total) {
      hasMore = false
    } else {
      page += 1
    }
  }

  return { properties: allPoints, total }
}
