'use client'

import { useMemo } from 'react'

import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions'
import {
  deriveMaxPriceOptions,
  deriveMinPriceOptions,
  filterRangeOptions,
  type PropertySortOption,
} from '@/utilities/propertyFilterOptions.shared'

/**
 * Option labels come from the Property Filters global (localized + DeepL).
 * Do not overlay Translations-collection keys — those duplicate CMS content.
 */

export function useSortOptions(): PropertySortOption[] {
  const { sortOptions } = usePropertyFilterOptions()
  return sortOptions
}

export function usePriceRangeOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  return useMemo(
    () => filterRangeOptions(priceRanges, selectedValues),
    [priceRanges, selectedValues],
  )
}

export function useBedroomOptions() {
  const { bedrooms } = usePropertyFilterOptions()
  return bedrooms
}

export function useBathroomOptions() {
  const { bathrooms } = usePropertyFilterOptions()
  return bathrooms
}

export function useMinPriceOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  return useMemo(
    () => deriveMinPriceOptions(filterRangeOptions(priceRanges, selectedValues)),
    [priceRanges, selectedValues],
  )
}

export function useMaxPriceOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  return useMemo(
    () => deriveMaxPriceOptions(filterRangeOptions(priceRanges, selectedValues)),
    [priceRanges, selectedValues],
  )
}

export function useFeatureFilterOptions() {
  const { features } = usePropertyFilterOptions()
  return features
}

export function useGuestOptions() {
  const { guests } = usePropertyFilterOptions()
  return guests
}

export function useHolidayBudgetOptions(selectedValues?: readonly string[] | null) {
  const { holidayBudgetRanges } = usePropertyFilterOptions()
  return useMemo(
    () => filterRangeOptions(holidayBudgetRanges, selectedValues),
    [holidayBudgetRanges, selectedValues],
  )
}
