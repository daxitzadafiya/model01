/**
 * Converts CRM listing bodies ({ options, query }) into GET /v3/properties/ query params.
 * Matches Optima PHP: status[]=…, sale=1, orderby=featured,-1, page_size, remove_count=1, etc.
 *
 * POST /commercial_properties accepted Mongo-style filters (archived, has_images, etc.).
 * GET /v3/properties only documents flat query params — drop unsupported Mongo keys.
 */
const GET_UNSUPPORTED_TOP_LEVEL_KEYS = new Set(['archived', 'has_images'])

const serializePrimitive = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value === null || value === undefined) return ''
  return String(value)
}

const serializeCRMValue = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    if (key === '$and' || key === '$or' || key === '$nor') {
      value.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          serializeCRMQueryObject(params, `${key}[${index}]`, item as Record<string, unknown>)
        }
      })
      return
    }

    for (const item of value) {
      params.append(`${key}[]`, serializePrimitive(item))
    }
    return
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if ('$in' in obj && Array.isArray(obj.$in)) {
      for (const item of obj.$in) {
        params.append(`${key}[]`, serializePrimitive(item))
      }
      for (const [op, opVal] of Object.entries(obj)) {
        if (op !== '$in') serializeCRMValue(params, `${key}[${op}]`, opVal)
      }
      return
    }

    const hasOperator = Object.keys(obj).some((op) => op.startsWith('$'))
    if (hasOperator) {
      for (const [op, opVal] of Object.entries(obj)) {
        serializeCRMValue(params, `${key}[${op}]`, opVal)
      }
      return
    }

    for (const [childKey, childVal] of Object.entries(obj)) {
      serializeCRMValue(params, `${key}[${childKey}]`, childVal)
    }
    return
  }

  params.append(key, serializePrimitive(value))
}

export const serializeCRMQueryObject = (
  params: URLSearchParams,
  prefix: string,
  query: Record<string, unknown>,
): void => {
  for (const [key, value] of Object.entries(query)) {
    if (!prefix && GET_UNSUPPORTED_TOP_LEVEL_KEYS.has(key)) continue

    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (key === '$and' || key === '$or' || key === '$nor') {
      serializeCRMValue(params, fullKey, value)
      continue
    }

    serializeCRMValue(params, fullKey, value)
  }
}

const formatSortDirection = (value: unknown): string => {
  if (value === true) return '-1'
  if (value === false) return '1'
  if (value === 1 || value === '1') return '1'
  if (value === -1 || value === '-1') return '-1'
  return String(value)
}

/** `{ featured: -1, updated_at: -1 }` → `featured,-1,updated_at,-1` */
export const formatCRMOrderby = (sort: Record<string, unknown>): string => {
  const parts: string[] = []

  for (const [field, direction] of Object.entries(sort)) {
    parts.push(field, formatSortDirection(direction))
  }

  return parts.join(',')
}

export const crmListingBodyToSearchParams = (body: Record<string, unknown>): URLSearchParams => {
  const params = new URLSearchParams()
  const options =
    body.options && typeof body.options === 'object'
      ? (body.options as Record<string, unknown>)
      : {}
  const query =
    body.query && typeof body.query === 'object' ? (body.query as Record<string, unknown>) : {}

  params.set('page', String(options.page ?? 1))
  params.set('page_size', String(options.limit ?? options.page_size ?? 12))

  const sortFromOptions =
    options.sort && typeof options.sort === 'object'
      ? (options.sort as Record<string, unknown>)
      : undefined
  const sortFromBody =
    body.sort && typeof body.sort === 'object' ? (body.sort as Record<string, unknown>) : undefined
  const sort = sortFromOptions ?? sortFromBody

  if (sort && Object.keys(sort).length > 0) {
    params.set('orderby', formatCRMOrderby(sort))
  } else {
    params.set('orderby', 'featured,-1')
  }

  serializeCRMQueryObject(params, '', query)

  return params
}
