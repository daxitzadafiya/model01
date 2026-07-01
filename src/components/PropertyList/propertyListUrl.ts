/** CRM property list URL params (server-prefetched). */

export const PROPERTY_LIST_PAGE_PARAM = 'page'
export const PROPERTY_LIST_SORT_PARAM = 'sort'

export function parsePropertyListPage(
  searchParams: Record<string, string | string[] | undefined> | null | undefined,
): number {
  const raw = searchParams?.[PROPERTY_LIST_PAGE_PARAM]
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

export function parsePropertyListSort(
  searchParams: Record<string, string | string[] | undefined> | null | undefined,
  fallback: string,
): string {
  const raw = searchParams?.[PROPERTY_LIST_SORT_PARAM]
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  return value || fallback
}

type ListingQueryUpdates = {
  page?: number
  sort?: string | null
}

function toSearchParams(current?: URLSearchParams | string | null): URLSearchParams {
  return new URLSearchParams(
    typeof current === 'string' ? current : (current?.toString() ?? ''),
  )
}

export function buildPropertyListListingQuery(
  updates: ListingQueryUpdates,
  current?: URLSearchParams | string | null,
): string {
  const params = toSearchParams(current)

  if (updates.page !== undefined) {
    if (updates.page <= 1) params.delete(PROPERTY_LIST_PAGE_PARAM)
    else params.set(PROPERTY_LIST_PAGE_PARAM, String(updates.page))
  }

  if (updates.sort !== undefined) {
    if (!updates.sort) params.delete(PROPERTY_LIST_SORT_PARAM)
    else params.set(PROPERTY_LIST_SORT_PARAM, updates.sort)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function buildPropertyListListingHref(
  pathname: string,
  updates: ListingQueryUpdates,
  current?: URLSearchParams | string | null,
): string {
  return `${pathname}${buildPropertyListListingQuery(updates, current)}`
}

/** @deprecated Use buildPropertyListListingHref */
export function buildPropertyListPageHref(
  pathname: string,
  page: number,
  current?: URLSearchParams | string | null,
): string {
  return buildPropertyListListingHref(pathname, { page }, current)
}
