'use client'

import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions'
import type { PropertySortOption } from '@/utilities/propertyFilterOptions.shared'

/**
 * Option labels come from the Property Filters global (localized + DeepL).
 * Do not overlay Translations-collection keys — those duplicate CMS content.
 */

export function useSortOptions(): PropertySortOption[] {
  const { sortOptions } = usePropertyFilterOptions()
  return sortOptions
}

export function usePriceRangeOptions() {
  const { priceRanges } = usePropertyFilterOptions()
  return priceRanges
}

export function useBedroomOptions() {
  const { bedrooms } = usePropertyFilterOptions()
  return bedrooms
}

export function useBathroomOptions() {
  const { bathrooms } = usePropertyFilterOptions()
  return bathrooms
}

export function useMinPriceOptions() {
  const { minPrices } = usePropertyFilterOptions()
  return minPrices
}

export function useMaxPriceOptions() {
  const { maxPrices } = usePropertyFilterOptions()
  return maxPrices
}

export function useFeatureFilterOptions() {
  const { features } = usePropertyFilterOptions()
  return features
}

export function useGuestOptions() {
  const { guests } = usePropertyFilterOptions()
  return guests
}

export function useHolidayBudgetOptions() {
  const { holidayBudgetRanges } = usePropertyFilterOptions()
  return holidayBudgetRanges
}
