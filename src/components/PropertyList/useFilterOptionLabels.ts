'use client'

import { useMemo } from 'react'

import { useTranslation } from '@/utilities/translateClient'

import {
  BEDROOM_OPTIONS,
  DELIVERY_OPTIONS,
  DISTANCE_OPTIONS,
  MAX_PRICE_OPTIONS,
  MIN_PRICE_OPTIONS,
  PRICE_RANGE_OPTIONS,
} from './filterOptions'

export function useSortOptions() {
  const newest = useTranslation('propertyList.sort.newest', 'Newest First')
  const priceDesc = useTranslation('propertyList.sort.priceDesc', 'Price: High to Low')
  const priceAsc = useTranslation('propertyList.sort.priceAsc', 'Price: Low to High')

  return useMemo(
    () => [
      { value: 'newest', label: newest },
      { value: 'priceDesc', label: priceDesc },
      { value: 'priceAsc', label: priceAsc },
    ],
    [newest, priceDesc, priceAsc],
  )
}

/** Currency and numeric range labels are kept as-is; only the "any" text label is translated. */
export function usePriceRangeOptions() {
  const anyLabel = useTranslation('propertyList.filters.priceRange.any', 'Any Price')

  return useMemo(
    () =>
      PRICE_RANGE_OPTIONS.map((opt) => ({
        ...opt,
        label: opt.value === 'any' ? anyLabel : opt.label,
      })),
    [anyLabel],
  )
}

/** Bedroom counts (1+, 2+, …) are not translated; only the "any" text label is. */
export function useBedroomOptions() {
  const anyLabel = useTranslation('propertyList.filters.bedrooms.any', 'Any Bedrooms')

  return useMemo(
    () =>
      BEDROOM_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value === 'any' ? anyLabel : opt.label,
      })),
    [anyLabel],
  )
}

/** Price amounts are not translated; only the "any" text label is. */
export function useMinPriceOptions() {
  const anyLabel = useTranslation('propertyList.filters.minPrice.any', 'Any Min Price')

  return useMemo(
    () =>
      MIN_PRICE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value === 'any' ? anyLabel : opt.label,
      })),
    [anyLabel],
  )
}

export function useMaxPriceOptions() {
  const anyLabel = useTranslation('propertyList.filters.maxPrice.any', 'Any Max Price')

  return useMemo(
    () =>
      MAX_PRICE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value === 'any' ? anyLabel : opt.label,
      })),
    [anyLabel],
  )
}

export function useStatusFilterOptions() {
  const project = useTranslation('propertyList.filters.status.project', 'New development')
  const resale = useTranslation('propertyList.filters.status.resale', 'Resale')

  return useMemo(
    () => [
      { value: 'project', label: project },
      { value: 'resale', label: resale },
    ],
    [project, resale],
  )
}

export function useFeatureFilterOptions() {
  const seaViews = useTranslation('propertyList.filters.features.sea views', 'Sea view')
  const mountain = useTranslation('propertyList.filters.features.mountain', 'Mountain')
  const golf = useTranslation('propertyList.filters.features.golf', 'Golf')

  return useMemo(
    () => [
      { value: 'sea views', label: seaViews },
      { value: 'mountain', label: mountain },
      { value: 'golf', label: golf },
    ],
    [seaViews, mountain, golf],
  )
}

/** Digits are kept literal; only words like "months" and "or older" are translated. */
export function useDeliveryOptions() {
  const deliveryDateLabel = useTranslation(
    'propertyList.filters.deliveryDate.empty',
    'Delivery date',
  )
  const handoverLabel = useTranslation('propertyList.filters.deliveryDate.handover', 'Handover')
  const monthsLabel = useTranslation('propertyList.filters.deliveryDate.months', 'months')
  const orOlderLabel = useTranslation('propertyList.filters.deliveryDate.orOlder', 'or older')

  return useMemo(
    () =>
      DELIVERY_OPTIONS.map((opt) => {
        if (opt.value === '') return { value: opt.value, label: deliveryDateLabel }
        if (opt.value === '1') return { value: opt.value, label: handoverLabel }
        if (opt.value === '60') {
          return { value: opt.value, label: `18 ${monthsLabel} ${orOlderLabel}` }
        }
        return { value: opt.value, label: `${opt.value} ${monthsLabel}` }
      }),
    [deliveryDateLabel, handoverLabel, monthsLabel, orOlderLabel],
  )
}

/** Distances and units are kept literal; only phrases like "Less than" are translated. */
export function useDistanceOptions() {
  const distanceToSeaLabel = useTranslation(
    'propertyList.filters.distanceToSea.empty',
    'Distance to the sea',
  )
  const lessThanLabel = useTranslation('propertyList.filters.distanceToSea.lessThan', 'Less than')
  const indifferentLabel = useTranslation(
    'propertyList.filters.distanceToSea.indifferent',
    'Indifferent',
  )

  return useMemo(
    () =>
      DISTANCE_OPTIONS.map((opt) => {
        if (opt.value === '') return { value: opt.value, label: distanceToSeaLabel }
        if (opt.value === '1000000') return { value: opt.value, label: indifferentLabel }
        // Strip the "Less than " prefix from the static label to recover the numeric part.
        const numericPart = opt.label.replace(/^Less than /, '')
        return { value: opt.value, label: `${lessThanLabel} ${numericPart}` }
      }),
    [distanceToSeaLabel, lessThanLabel, indifferentLabel],
  )
}
