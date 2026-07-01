import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import type { PropertySortOption } from '@/utilities/propertyFilterOptions.shared'
import { getPropertyFilterOptions } from '@/utilities/getPropertyFilterOptions'

/** Resolve list sort from URL without hitting CMS when defaults are enough. */
export async function resolveListingSortOption(
  sortValue?: string | null,
  locale?: string,
): Promise<PropertySortOption> {
  const defaults = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions
  const trimmed = sortValue?.trim()

  if (trimmed) {
    const fromDefaults = defaults.find((option) => option.value === trimmed)
    if (fromDefaults) return fromDefaults
  }

  if (trimmed) {
    const filterOptions = await getPropertyFilterOptions(locale)
    const fromCms = filterOptions.sortOptions.find((option) => option.value === trimmed)
    if (fromCms) return fromCms
  }

  return defaults[0]
}
