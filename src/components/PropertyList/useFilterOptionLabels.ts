'use client'

import { useMemo } from 'react'

import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions'
import type { PropertySortOption } from '@/utilities/propertyFilterOptions.shared'
import { useTranslatedOptions, useTranslation } from '@/utilities/translateClient'

export function useSortOptions(): PropertySortOption[] {
  const { sortOptions } = usePropertyFilterOptions()
  const translated = useTranslatedOptions(sortOptions, 'propertyList.sort')

  return useMemo(
    () =>
      sortOptions.map((option, index) => ({
        ...option,
        label: translated[index]?.label ?? option.label,
      })),
    [sortOptions, translated],
  )
}

export function usePriceRangeOptions() {
  const { priceRanges } = usePropertyFilterOptions()

  return useTranslatedOptions(priceRanges, 'propertyList.filters.priceRange')
}

export function useBedroomOptions() {
  const { bedrooms } = usePropertyFilterOptions()

  return useTranslatedOptions(bedrooms, 'propertyList.filters.bedrooms')
}

export function useBathroomOptions() {
  const { bathrooms } = usePropertyFilterOptions()

  return useTranslatedOptions(bathrooms, 'propertyList.filters.bathrooms')
}

export function useMinPriceOptions() {
  const { minPrices } = usePropertyFilterOptions()

  return useTranslatedOptions(minPrices, 'propertyList.filters.minPrice')
}

export function useMaxPriceOptions() {
  const { maxPrices } = usePropertyFilterOptions()

  return useTranslatedOptions(maxPrices, 'propertyList.filters.maxPrice')
}

export function useFeatureFilterOptions() {
  const { features } = usePropertyFilterOptions()

  return useTranslatedOptions(features, 'propertyList.filters.features')
}
