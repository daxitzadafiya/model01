'use client'

import React, { useState } from 'react'
import { Banknote, Home, MapPin, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import type { FilterSelectOption } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import type { PropertyListFilters as Filters } from '@/utilities/crmProperties'
import {
  applyPriceRangeValue,
  EMPTY_PROPERTY_FILTERS,
  hasActivePropertyFilters,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from './filterOptions'
import { usePriceRangeOptions } from './useFilterOptionLabels'
import { PropertyListMoreFiltersModal } from './PropertyListMoreFiltersModal'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  filters: Filters
  appliedFilters: Filters
  onChange: (key: keyof Filters, value: Filters[keyof Filters]) => void
  onApply: (nextFilters: Filters) => void
  showMap?: boolean | null
  onOpenMap?: () => void
  propertyTypeOptions: FilterSelectOption[]
  propertyTypeLoading?: boolean
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
}

export const PropertyListFilters: React.FC<Props> = ({
  filters,
  appliedFilters,
  onChange,
  onApply,
  showMap,
  onOpenMap,
  propertyTypeOptions,
  propertyTypeLoading = false,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const priceRangeOptions = usePriceRangeOptions()
  const priceRange = resolvePriceRangeValue(filters.minPrice, filters.maxPrice, priceRangeOptions)
  const showClearFilters = hasActivePropertyFilters(appliedFilters)

  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const priceRangeLabel = useTranslation('propertyList.filters.priceRange', 'Price Range')
  const clearFiltersLabel = useTranslation('propertyList.filters.clearFilters', 'Clear Filters')
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const moreFiltersAriaLabel = useTranslation(
    'propertyList.filters.moreFiltersAria',
    'More filters',
  )
  const searchByMapLabel = useTranslation('propertyList.filters.searchByMap', 'Search By Map')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({ ...filters })
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range, priceRangeOptions)
    onChange('minPrice', minPrice)
    onChange('maxPrice', maxPrice)
  }

  const handleModalSearch = () => {
    onApply({ ...filters })
    setModalOpen(false)
  }

  const handleClear = () => {
    onApply({ ...EMPTY_PROPERTY_FILTERS })
    setModalOpen(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="relative z-20 -mt-4 mb-6">
        <div className="bg-surface-container-lowest shadow-2xl rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-end gap-6 border border-outline-variant/30">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            <CoastCityFilterFields
              coast={filters.coast}
              city={filters.city}
              onCoastChange={(value) => onChange('coast', value)}
              onCityChange={(value) => onChange('city', value)}
              coasts={coasts}
              coastsLoading={coastsLoading}
              cities={cities}
              citiesLoading={citiesLoading}
              coastId="filter-bar-coast"
              cityId="filter-bar-city"
            />

            <FilterSelect
              mode="multi"
              label={propertyTypeLabel}
              id="filter-bar-type"
              icon={<Home size={20} strokeWidth={1.75} />}
              options={propertyTypeOptions}
              value={parsePropertyTypeFilter(filters.propertyType)}
              onChange={(value) => onChange('propertyType', value)}
              emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
              disabled={propertyTypeLoading}
            />

            <FilterSelect
              label={priceRangeLabel}
              id="filter-bar-price"
              icon={<Banknote size={20} strokeWidth={1.75} />}
              options={priceRangeOptions}
              value={priceRange}
              onChange={handlePriceRangeChange}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-3 border cursor-pointer border-outline-variant hover:border-tertiary hover:text-tertiary transition-colors duration-300 rounded-lg flex items-center justify-center"
              title={moreFiltersAriaLabel}
              aria-label={moreFiltersAriaLabel}
            >
              <SlidersHorizontal size={20} />
            </button>
            {showMap && onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="px-4 py-3 border cursor-pointer border-outline-variant hover:border-tertiary hover:text-tertiary transition-colors duration-300 rounded-lg flex items-center justify-center"
                title={searchByMapLabel}
                aria-label={searchByMapLabel}
              >
                <MapPin size={20} />
              </button>
            )}
            {showClearFilters && (
              <button
                type="button"
                onClick={handleClear}
                title={clearFiltersLabel}
                aria-label={clearFiltersLabel}
                className="px-4 py-3 border cursor-pointer border-outline-variant text-on-surface-variant font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:border-tertiary hover:text-tertiary transition-colors duration-300"
              >
                <RotateCcw size={18} />
                <span className="hidden md:inline">{clearFiltersLabel}</span>
              </button>
            )}
            <button
              type="submit"
              title={searchLabel}
              aria-label={searchLabel}
              className="flex-1 cursor-pointer md:flex-none px-8 md:px-12 py-3 bg-primary text-on-primary font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary hover:text-on-tertiary transition-colors duration-300"
            >
              <Search size={18} />
              <span className="hidden md:inline">{searchLabel}</span>
            </button>
          </div>
        </div>
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
        coasts={coasts}
        coastsLoading={coastsLoading}
        cities={cities}
        citiesLoading={citiesLoading}
      />
    </>
  )
}
