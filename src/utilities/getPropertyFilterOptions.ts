import type { PropertyFilter } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import {
  DEFAULT_PROPERTY_FILTER_OPTIONS,
  type FilterSelectOption,
  type PriceRangeOption,
  type PropertyFilterOptions,
} from '@/utilities/propertyFilterOptions.shared'

export type { FilterSelectOption, PriceRangeOption, PropertyFilterOptions }

type FilterOptionRow = { value?: string | null; label?: string | null }

function normalizeSimpleOptions(
  rows: FilterOptionRow[] | null | undefined,
  fallback: readonly FilterSelectOption[],
): FilterSelectOption[] {
  const mapped = (rows ?? [])
    .map((row) => ({
      value: row.value?.trim() ?? '',
      label: row.label?.trim() ?? '',
    }))
    .filter((row) => row.label.length > 0)

  return mapped.length > 0 ? mapped : [...fallback]
}

function normalizePriceRanges(
  rows: PropertyFilter['priceRanges'],
  fallback: readonly PriceRangeOption[],
): PriceRangeOption[] {
  const mapped = (rows ?? [])
    .map((row) => ({
      value: row.value?.trim() ?? '',
      label: row.label?.trim() ?? '',
      min: row.min?.trim() ?? 'any',
      max: row.max?.trim() ?? 'any',
    }))
    .filter((row) => row.value.length > 0 && row.label.length > 0)

  return mapped.length > 0 ? mapped : [...fallback]
}

export function normalizePropertyFilterOptions(
  doc: PropertyFilter | null | undefined,
): PropertyFilterOptions {
  if (!doc) return DEFAULT_PROPERTY_FILTER_OPTIONS

  return {
    priceRanges: normalizePriceRanges(doc.priceRanges, DEFAULT_PROPERTY_FILTER_OPTIONS.priceRanges),
    bedrooms: normalizeSimpleOptions(doc.bedrooms, DEFAULT_PROPERTY_FILTER_OPTIONS.bedrooms),
    minPrices: normalizeSimpleOptions(doc.minPrices, DEFAULT_PROPERTY_FILTER_OPTIONS.minPrices),
    maxPrices: normalizeSimpleOptions(doc.maxPrices, DEFAULT_PROPERTY_FILTER_OPTIONS.maxPrices),
    statuses: normalizeSimpleOptions(doc.statuses, DEFAULT_PROPERTY_FILTER_OPTIONS.statuses),
    features: normalizeSimpleOptions(doc.features, DEFAULT_PROPERTY_FILTER_OPTIONS.features),
    deliveryDates: normalizeSimpleOptions(
      doc.deliveryDates,
      DEFAULT_PROPERTY_FILTER_OPTIONS.deliveryDates,
    ),
    distanceToSea: normalizeSimpleOptions(
      doc.distanceToSea,
      DEFAULT_PROPERTY_FILTER_OPTIONS.distanceToSea,
    ),
  }
}

export async function getPropertyFilterOptions(locale?: string): Promise<PropertyFilterOptions> {
  const getGlobal = getCachedGlobal('propertyFilters', 0, locale as never)
  const doc = await getGlobal()
  return normalizePropertyFilterOptions(doc)
}
