'use client'

import { useMemo } from 'react'

import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions'
import { useTranslatedOptions, useTranslation } from '@/utilities/translateClient'

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

export function usePriceRangeOptions() {
  const { priceRanges } = usePropertyFilterOptions()

  return useTranslatedOptions(priceRanges, 'propertyList.filters.priceRange')
}

export function useBedroomOptions() {
  const { bedrooms } = usePropertyFilterOptions()

  return useTranslatedOptions(bedrooms, 'propertyList.filters.bedrooms')
}

export function useMinPriceOptions() {
  const { minPrices } = usePropertyFilterOptions()

  return useTranslatedOptions(minPrices, 'propertyList.filters.minPrice')
}

export function useMaxPriceOptions() {
  const { maxPrices } = usePropertyFilterOptions()

  return useTranslatedOptions(maxPrices, 'propertyList.filters.maxPrice')
}

export function useStatusFilterOptions() {
  const { statuses } = usePropertyFilterOptions()

  return useTranslatedOptions(statuses, 'propertyList.filters.status')
}

export function useFeatureFilterOptions() {
  const { features } = usePropertyFilterOptions()

  return useTranslatedOptions(features, 'propertyList.filters.features')
}

export function useDeliveryOptions() {
  const { deliveryDates } = usePropertyFilterOptions()

  return useTranslatedOptions(deliveryDates, 'propertyList.filters.deliveryDate')
}

export function useDistanceOptions() {
  const { distanceToSea } = usePropertyFilterOptions()

  return useTranslatedOptions(distanceToSea, 'propertyList.filters.distanceToSea')
}
