import {
  BEDROOM_OPTIONS,
  DELIVERY_OPTIONS,
  DISTANCE_OPTIONS,
  MAX_PRICE_OPTIONS,
  MIN_PRICE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PROPERTY_LISTING_FEATURE_OPTIONS,
  PROPERTY_LISTING_STATUS_OPTIONS,
  SORT_OPTIONS,
} from '@/components/PropertyList/filterOptions'

export type FilterSelectOption = { value: string; label: string }

export type PriceRangeOption = FilterSelectOption & { min: string; max: string }

export type PropertySortOption = FilterSelectOption & {
  sort: Record<string, unknown>
}

export type PropertyFilterOptions = {
  sortOptions: PropertySortOption[]
  priceRanges: PriceRangeOption[]
  bedrooms: FilterSelectOption[]
  minPrices: FilterSelectOption[]
  maxPrices: FilterSelectOption[]
  statuses: FilterSelectOption[]
  features: FilterSelectOption[]
  deliveryDates: FilterSelectOption[]
  distanceToSea: FilterSelectOption[]
}

export const DEFAULT_PROPERTY_FILTER_OPTIONS: PropertyFilterOptions = {
  sortOptions: SORT_OPTIONS.map((opt) => ({ ...opt, sort: { ...opt.sort } })),
  priceRanges: PRICE_RANGE_OPTIONS.map((opt) => ({ ...opt })),
  bedrooms: BEDROOM_OPTIONS.map((opt) => ({ ...opt })),
  minPrices: MIN_PRICE_OPTIONS.map((opt) => ({ ...opt })),
  maxPrices: MAX_PRICE_OPTIONS.map((opt) => ({ ...opt })),
  statuses: PROPERTY_LISTING_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
  features: PROPERTY_LISTING_FEATURE_OPTIONS.map(({ value, label }) => ({ value, label })),
  deliveryDates: DELIVERY_OPTIONS.map((opt) => ({ ...opt })),
  distanceToSea: DISTANCE_OPTIONS.map((opt) => ({ ...opt })),
}
