import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  GUEST_OPTIONS,
  HOLIDAY_BUDGET_OPTIONS,
  MAX_PRICE_OPTIONS,
  MIN_PRICE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PROPERTY_LISTING_FEATURE_OPTIONS,
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
  bathrooms: FilterSelectOption[]
  minPrices: FilterSelectOption[]
  maxPrices: FilterSelectOption[]
  features: FilterSelectOption[]
  guests: FilterSelectOption[]
  holidayBudgetRanges: PriceRangeOption[]
}

export const DEFAULT_PROPERTY_FILTER_OPTIONS: PropertyFilterOptions = {
  sortOptions: SORT_OPTIONS.map((opt) => ({ ...opt, sort: { ...opt.sort } })),
  priceRanges: PRICE_RANGE_OPTIONS.map((opt) => ({ ...opt })),
  bedrooms: BEDROOM_OPTIONS.map((opt) => ({ ...opt })),
  bathrooms: BATHROOM_OPTIONS.map((opt) => ({ ...opt })),
  minPrices: MIN_PRICE_OPTIONS.map((opt) => ({ ...opt })),
  maxPrices: MAX_PRICE_OPTIONS.map((opt) => ({ ...opt })),
  features: PROPERTY_LISTING_FEATURE_OPTIONS.map(({ value, label }) => ({ value, label })),
  guests: GUEST_OPTIONS.map((opt) => ({ ...opt })),
  holidayBudgetRanges: HOLIDAY_BUDGET_OPTIONS.map((opt) => ({ ...opt })),
}
