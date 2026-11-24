import { cache } from 'react'

import type { PropertyFilter } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { parseCRMSortParams } from '@/utilities/crmProperties'
import {
  DEFAULT_PROPERTY_FILTER_OPTIONS,
  deriveMaxPriceOptions,
  deriveMinPriceOptions,
  type FilterSelectOption,
  type PriceRangeOption,
  type PropertyFilterOptions,
  type PropertySortOption,
} from '@/utilities/propertyFilterOptions.shared'
import { t } from '@/utilities/translate'

export type { FilterSelectOption, PriceRangeOption, PropertyFilterOptions, PropertySortOption }

type FilterOptionRow = { value?: string | null; label?: string | null }

type SortOptionRow = FilterOptionRow & { sortParams?: string | null }

/** Translation keys for static English fallbacks in filterOptions.ts */
const LABEL_KEYS: Record<string, Record<string, string>> = {
  priceRanges: { any: 'filter.anyPrice' },
  minPrices: { any: 'filter.anyMinPrice' },
  maxPrices: { any: 'filter.anyMaxPrice' },
  bedrooms: { any: 'filter.anyBedrooms', other: 'filter.needMore' },
  bathrooms: { any: 'filter.anyBathrooms', other: 'filter.needMore' },
  features: {
    'sea views': 'filter.seaView',
    mountain: 'filter.mountain',
    golf: 'filter.golf',
  },
  deliveryDates: {
    // Prefer field-label keys: CMS “any” rows often reuse “Delivery date”.
    any: 'propertyList.filters.deliveryDate',
    '1': 'filter.keyReady',
    '3': 'filter.threeMonths',
    '6': 'filter.sixMonths',
    '12': 'filter.twelveMonths',
    '18': 'filter.eighteenMonths',
    '60': 'filter.eighteenMonthsOrOlder',
  },
  distanceToSea: {
    any: 'propertyList.filters.distanceToSea',
    '600': 'filter.lessThanSixHundredMeters',
    '1000': 'filter.lessThanOneKilometer',
    '3000': 'filter.lessThanThreeKilometers',
    '6000': 'filter.lessThanSixKilometers',
    '12000': 'filter.lessThanTwelveKilometers',
    '1000000': 'filter.indifferent',
  },
  sortOptions: {
    recent: 'filter.recent',
    relevance: 'filter.relevance',
    priceAsc: 'filter.lowestPrice',
    priceDesc: 'filter.highestPrice',
  },
  guests: {
    any: 'filter.anyGuests',
    '1': 'filter.oneGuest',
    '2': 'filter.twoGuests',
    '3': 'filter.threeGuests',
    '4': 'filter.fourGuests',
    '5': 'filter.fiveGuests',
    other: 'filter.needMore',
  },
  holidayBudgetRanges: {
    any: 'filter.anyBudget',
    '0-500': 'filter.upToFiveHundred',
  },
}

function englishLabelsForValue(
  value: string,
  sources: ReadonlyArray<readonly { value: string; label: string }[] | undefined>,
): Set<string> {
  const labels = new Set<string>()
  for (const source of sources) {
    for (const option of source ?? []) {
      if (option.value === value && option.label) labels.add(option.label)
    }
  }
  return labels
}

async function translateLabels<T extends { value: string; label: string }>(
  options: readonly T[],
  group: string,
  locale: string,
  /**
   * English source labels — used so DeepL never treats a localized CMS label as English.
   * Pass both code defaults and the EN CMS rows: admins often customize EN copy
   * (e.g. "Delivery date" instead of "Any delivery"), and Payload locale fallback
   * then copies that EN string into other locales.
   */
  ...englishSources: Array<readonly { value: string; label: string }[] | undefined>
): Promise<T[]> {
  const keys = LABEL_KEYS[group]
  if (!keys) return options.map((option) => ({ ...option }))

  return Promise.all(
    options.map(async (option) => {
      const key = keys[option.value]
      if (!key) return { ...option }

      const englishLabels = englishLabelsForValue(option.value, englishSources)
      const englishFallback = englishSources
        .flatMap((source) => source ?? [])
        .find((row) => row.value === option.value)?.label

      // Keep CMS-localized / customized labels; only translate English leftovers
      // (common when Payload locale fallback returns the default-locale string).
      if (englishLabels.size > 0 && !englishLabels.has(option.label)) return { ...option }

      return {
        ...option,
        label: await t(key, locale, option.label || englishFallback || ''),
      }
    }),
  )
}

/** Translate static DEFAULT_PROPERTY_FILTER_OPTIONS for the active locale. */
async function localizeDefaults(locale: string): Promise<PropertyFilterOptions> {
  const defaults = DEFAULT_PROPERTY_FILTER_OPTIONS
  const [
    sortOptions,
    priceRanges,
    bedrooms,
    bathrooms,
    features,
    deliveryDates,
    distanceToSea,
    guests,
    holidayBudgetRanges,
    anyMin,
    anyMax,
  ] = await Promise.all([
    translateLabels(defaults.sortOptions, 'sortOptions', locale),
    translateLabels(defaults.priceRanges, 'priceRanges', locale),
    translateLabels(defaults.bedrooms, 'bedrooms', locale),
    translateLabels(defaults.bathrooms, 'bathrooms', locale),
    translateLabels(defaults.features, 'features', locale),
    translateLabels(defaults.deliveryDates, 'deliveryDates', locale),
    translateLabels(defaults.distanceToSea, 'distanceToSea', locale),
    translateLabels(defaults.guests, 'guests', locale),
    translateLabels(defaults.holidayBudgetRanges, 'holidayBudgetRanges', locale),
    t('filter.anyMinPrice', locale, 'Any Min Price'),
    t('filter.anyMaxPrice', locale, 'Any Max Price'),
  ])

  return {
    sortOptions: sortOptions as PropertySortOption[],
    priceRanges: priceRanges as PriceRangeOption[],
    bedrooms,
    bathrooms,
    minPrices: deriveMinPriceOptions(priceRanges as PriceRangeOption[], anyMin),
    maxPrices: deriveMaxPriceOptions(priceRanges as PriceRangeOption[], anyMax),
    features,
    deliveryDates,
    distanceToSea,
    guests,
    holidayBudgetRanges: holidayBudgetRanges as PriceRangeOption[],
  }
}

function normalizeSortOptions(
  rows: SortOptionRow[] | null | undefined,
  fallback: readonly PropertySortOption[],
): PropertySortOption[] {
  const mapped = (rows ?? [])
    .map((row) => {
      const value = row.value?.trim() ?? ''
      const label = row.label?.trim() ?? ''
      const sort = parseCRMSortParams(row.sortParams ?? '')
      if (!value || !label || !sort) return null
      return { value, label, sort }
    })
    .filter((row): row is PropertySortOption => row !== null)

  return mapped.length > 0 ? mapped : [...fallback]
}

function normalizeSimpleOptions(
  rows: FilterOptionRow[] | null | undefined,
  fallback: readonly FilterSelectOption[],
): FilterSelectOption[] {
  const mapped = (rows ?? [])
    .map((row) => {
      const trimmed = row.value?.trim() ?? ''
      return {
        // Blank / whitespace CRM “any” rows → canonical `any`.
        value: trimmed || 'any',
        label: row.label?.trim() ?? '',
      }
    })
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
  fallback: PropertyFilterOptions = DEFAULT_PROPERTY_FILTER_OPTIONS,
): PropertyFilterOptions {
  if (!doc) return fallback

  const priceRanges = normalizePriceRanges(doc.priceRanges, fallback.priceRanges)

  return {
    sortOptions: normalizeSortOptions(doc.sortOptions, fallback.sortOptions),
    priceRanges,
    bedrooms: normalizeSimpleOptions(doc.bedrooms, fallback.bedrooms),
    bathrooms: normalizeSimpleOptions(doc.bathrooms, fallback.bathrooms),
    // More Filters Min/Max options are derived from price ranges (not admin catalogs).
    minPrices: deriveMinPriceOptions(priceRanges, fallback.minPrices[0]?.label),
    maxPrices: deriveMaxPriceOptions(priceRanges, fallback.maxPrices[0]?.label),
    features: normalizeSimpleOptions(doc.features, fallback.features),
    deliveryDates: normalizeSimpleOptions(doc.deliveryDates, fallback.deliveryDates),
    distanceToSea: normalizeSimpleOptions(doc.distanceToSea, fallback.distanceToSea),
    guests: normalizeSimpleOptions(doc.guests, fallback.guests),
    holidayBudgetRanges: normalizePriceRanges(
      doc.holidayBudgetRanges,
      fallback.holidayBudgetRanges,
    ),
  }
}

export const getPropertyFilterOptions = cache(
  async (locale?: string): Promise<PropertyFilterOptions> => {
    const lang = locale?.trim() || 'en'
    const fallback = await localizeDefaults(lang)
    const getGlobal = getCachedGlobal('propertyFilters', 0, locale as never)
    const doc = await getGlobal()
    const normalized = normalizePropertyFilterOptions(doc, fallback)

    if (lang === 'en') return normalized

    // EN CMS labels (plus code defaults) identify English leftovers after locale fallback.
    const defaults = DEFAULT_PROPERTY_FILTER_OPTIONS
    const getGlobalEn = getCachedGlobal('propertyFilters', 0, 'en' as never)
    const docEn = await getGlobalEn()
    const englishCms = normalizePropertyFilterOptions(docEn, defaults)

    const [bedrooms, bathrooms, features, deliveryDates, distanceToSea, guests, holidayBudgetRanges] =
      await Promise.all([
        translateLabels(normalized.bedrooms, 'bedrooms', lang, defaults.bedrooms, englishCms.bedrooms),
        translateLabels(
          normalized.bathrooms,
          'bathrooms',
          lang,
          defaults.bathrooms,
          englishCms.bathrooms,
        ),
        translateLabels(normalized.features, 'features', lang, defaults.features, englishCms.features),
        translateLabels(
          normalized.deliveryDates,
          'deliveryDates',
          lang,
          defaults.deliveryDates,
          englishCms.deliveryDates,
        ),
        translateLabels(
          normalized.distanceToSea,
          'distanceToSea',
          lang,
          defaults.distanceToSea,
          englishCms.distanceToSea,
        ),
        translateLabels(normalized.guests, 'guests', lang, defaults.guests, englishCms.guests),
        translateLabels(
          normalized.holidayBudgetRanges,
          'holidayBudgetRanges',
          lang,
          defaults.holidayBudgetRanges,
          englishCms.holidayBudgetRanges,
        ),
      ])

    return {
      ...normalized,
      bedrooms,
      bathrooms,
      features,
      deliveryDates,
      distanceToSea,
      guests,
      holidayBudgetRanges: holidayBudgetRanges as PriceRangeOption[],
    }
  },
)
