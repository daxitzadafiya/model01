'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Banknote, Home, MapPin, Search, SlidersHorizontal, Tag } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import type { FilterSelectOption } from '@/components/FilterSelect'
import type { CRMLocationCity } from '@/utilities/crmLocations'
import type { PropertyListFilters as Filters } from '@/utilities/crmProperties'
import {
  applyPriceRangeValue,
  EMPTY_PROPERTY_FILTERS,
  PRICE_RANGE_OPTIONS,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from './filterOptions'
import { PropertyListMoreFiltersModal } from './PropertyListMoreFiltersModal'

type Props = {
  filters: Filters
  onChange: (key: keyof Filters, value: Filters[keyof Filters]) => void
  onApply: (nextFilters: Filters) => void
  mapSearchUrl?: string | null
  propertyTypeOptions: FilterSelectOption[]
  propertyTypeLoading?: boolean
  locationTree: CRMLocationCity[]
  locationLoading?: boolean
}

const fieldLabelClass = 'font-label-sm text-label-sm uppercase text-on-surface-variant ml-1'

export const PropertyListFilters: React.FC<Props> = ({
  filters,
  onChange,
  onApply,
  mapSearchUrl,
  propertyTypeOptions,
  propertyTypeLoading = false,
  locationTree,
  locationLoading = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const priceRange = resolvePriceRangeValue(filters.minPrice, filters.maxPrice)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({ ...filters })
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range)
    onChange('minPrice', minPrice)
    onChange('maxPrice', maxPrice)
  }

  const handleModalSearch = () => {
    onApply({ ...filters })
    setModalOpen(false)
  }

  const handleClear = () => {
    const cleared = { ...EMPTY_PROPERTY_FILTERS }
    ;(Object.entries(cleared) as [keyof Filters, Filters[keyof Filters]][]).forEach(
      ([key, value]) => {
        onChange(key, value)
      },
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="relative z-20 -mt-4 mb-6">
        <div className="bg-surface-container-lowest shadow-2xl rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-end gap-6 border border-outline-variant/30">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="flex flex-col gap-2">
              <label className={fieldLabelClass} htmlFor="filter-bar-reference">
                Reference
              </label>
              <div className="relative">
                <Tag
                  size={20}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
                  aria-hidden
                />
                <input
                  id="filter-bar-reference"
                  type="text"
                  placeholder="Enter reference"
                  value={filters.reference ?? ''}
                  onChange={(e) => onChange('reference', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>

            <FilterSelect
              mode="multi"
              label="Property Type"
              id="filter-bar-type"
              icon={<Home size={20} strokeWidth={1.75} />}
              options={propertyTypeOptions}
              value={parsePropertyTypeFilter(filters.propertyType)}
              onChange={(value) => onChange('propertyType', value)}
              emptyLabel={propertyTypeLoading ? 'Loading types…' : 'All Properties'}
              disabled={propertyTypeLoading}
            />

            <FilterSelect
              label="Price Range"
              id="filter-bar-price"
              icon={<Banknote size={20} strokeWidth={1.75} />}
              options={PRICE_RANGE_OPTIONS}
              value={priceRange}
              onChange={handlePriceRangeChange}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-3 border border-outline-variant hover:border-tertiary hover:text-tertiary transition-colors duration-300 rounded-lg flex items-center justify-center"
              aria-label="More filters"
            >
              <SlidersHorizontal size={20} />
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none px-8 md:px-12 py-3 bg-primary text-on-primary font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary hover:text-on-tertiary transition-colors duration-300"
            >
              <Search size={18} />
              Search
            </button>
          </div>
        </div>

        {mapSearchUrl && (
          <Link
            href={mapSearchUrl}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-deep-navy bg-surface-container-lowest py-2.5 font-body-md text-body-md text-deep-navy hover:bg-surface-container-high transition-colors"
          >
            <MapPin size={18} className="shrink-0" />
            Search By Map
          </Link>
        )}
      </form>

      <PropertyListMoreFiltersModal
        open={modalOpen}
        filters={filters}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onClear={handleClear}
        onSearch={handleModalSearch}
        propertyTypeOptions={propertyTypeOptions}
        propertyTypeLoading={propertyTypeLoading}
        locationTree={locationTree}
        locationLoading={locationLoading}
      />
    </>
  )
}
