'use client'

import React, { useEffect } from 'react'
import {
  Banknote,
  Bed,
  Calendar,
  Home,
  ListFilter,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Waves,
  X,
} from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import type { FilterSelectOption } from '@/components/FilterSelect'
import { LocationFilterSelect } from '@/components/LocationFilterSelect'
import type { CRMLocationCity } from '@/utilities/crmLocations'
import type { PropertyListFilters as Filters } from '@/utilities/crmProperties'
import type { FloatingMenuPlacement } from '@/utilities/floatingMenuPosition'
import {
  parseFeaturesFilter,
  parseLocationFilter,
  parsePropertyTypeFilter,
  parseStatusFilter,
} from './filterOptions'
import {
  useBedroomOptions,
  useDeliveryOptions,
  useDistanceOptions,
  useFeatureFilterOptions,
  useMaxPriceOptions,
  useMinPriceOptions,
  useStatusFilterOptions,
} from './useFilterOptionLabels'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  open: boolean
  filters: Filters
  onChange: (key: keyof Filters, value: Filters[keyof Filters]) => void
  onClose: () => void
  onClear: () => void
  onSearch: () => void
  propertyTypeOptions: FilterSelectOption[]
  propertyTypeLoading?: boolean
  locationTree: CRMLocationCity[]
  locationLoading?: boolean
}

const labelClass = 'font-label-sm text-label-sm uppercase text-on-surface-variant'

const modalInputClass =
  'w-full bg-surface-container-low border-transparent focus:border-tertiary focus:ring-0 rounded-lg py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface'

const filterFieldIcon = { size: 20, strokeWidth: 1.75 } as const

const ModalFieldSelect: React.FC<{
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  menuPlacement?: FloatingMenuPlacement
  icon?: React.ReactNode
}> = ({ label, value, options, onChange, menuPlacement, icon }) => (
  <FilterSelect
    label={label}
    options={options}
    value={value}
    onChange={onChange}
    menuPlacement={menuPlacement}
    icon={icon}
  />
)

export const PropertyListMoreFiltersModal: React.FC<Props> = ({
  open,
  filters,
  onChange,
  onClose,
  onClear,
  onSearch,
  propertyTypeOptions,
  propertyTypeLoading = false,
  locationTree,
  locationLoading = false,
}) => {
  const moreFiltersLabel = useTranslation('propertyList.filters.moreFilters', 'More Filters')
  const referenceLabel = useTranslation('propertyList.filters.reference', 'Reference')
  const referencePlaceholder = useTranslation(
    'propertyList.filters.reference.placeholder',
    'Reference...',
  )
  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const locationLabel = useTranslation('propertyList.filters.location', 'Location')
  const locationPlaceholder = useTranslation('propertyList.filters.location.placeholder', 'Location')
  const locationEmptyLabel = useTranslation('propertyList.filters.location.emptyLabel', 'Location')
  const bedroomsLabel = useTranslation('propertyList.filters.bedrooms', 'Bedrooms')
  const minPriceLabel = useTranslation('propertyList.filters.minPrice', 'Min Price')
  const maxPriceLabel = useTranslation('propertyList.filters.maxPrice', 'Max Price')
  const statusLabel = useTranslation('propertyList.filters.status', 'Status')
  const statusEmptyLabel = useTranslation('propertyList.filters.status.emptyLabel', 'Status')
  const featuresLabel = useTranslation('propertyList.filters.features', 'Features')
  const featuresEmptyLabel = useTranslation('propertyList.filters.features.emptyLabel', 'Features')
  const deliveryDateLabel = useTranslation('propertyList.filters.deliveryDate', 'Delivery Date')
  const distanceToSeaLabel = useTranslation(
    'propertyList.filters.distanceToSea',
    'Distance to the Sea',
  )
  const clearFiltersLabel = useTranslation('propertyList.filters.clearFilters', 'Clear Filters')
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const closeFiltersAriaLabel = useTranslation(
    'propertyList.filters.closeFiltersAria',
    'Close filters',
  )
  const closeAriaLabel = useTranslation('propertyList.filters.closeAria', 'Close')
  const bedroomOptions = useBedroomOptions()
  const minPriceOptions = useMinPriceOptions()
  const maxPriceOptions = useMaxPriceOptions()
  const statusFilterOptions = useStatusFilterOptions()
  const featureFilterOptions = useFeatureFilterOptions()
  const deliveryOptions = useDeliveryOptions()
  const distanceOptions = useDistanceOptions()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-filters-title"
    >
      <button
        type="button"
        aria-label={closeFiltersAriaLabel}
        className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 md:px-8 py-5">
          <h2 id="more-filters-title" className="font-headline-sm text-headline-sm text-on-surface">
            {moreFiltersLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label={closeAriaLabel}
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 py-6 font-body-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} htmlFor="filter-reference">
                {referenceLabel}
              </label>
              <div className="relative">
                <Tag
                  {...filterFieldIcon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
                  aria-hidden
                />
                <input
                  id="filter-reference"
                  type="text"
                  placeholder={referencePlaceholder}
                  value={filters.reference ?? ''}
                  onChange={(e) => onChange('reference', e.target.value)}
                  className={modalInputClass}
                />
              </div>
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label={propertyTypeLabel}
                options={propertyTypeOptions}
                value={parsePropertyTypeFilter(filters.propertyType)}
                onChange={(value) => onChange('propertyType', value)}
                emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
                disabled={propertyTypeLoading}
                icon={<Home {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <LocationFilterSelect
                label={locationLabel}
                tree={locationTree}
                value={parseLocationFilter(filters.location)}
                onChange={(value) => onChange('location', value)}
                placeholder={locationPlaceholder}
                emptyLabel={locationEmptyLabel}
                loading={locationLoading}
                disabled={locationLoading}
                icon={<MapPin {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={bedroomsLabel}
                value={filters.bedrooms ?? 'any'}
                options={bedroomOptions}
                onChange={(v) => onChange('bedrooms', v)}
                icon={<Bed {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={minPriceLabel}
                value={filters.minPrice ?? 'any'}
                options={minPriceOptions}
                onChange={(v) => onChange('minPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={maxPriceLabel}
                value={filters.maxPrice ?? 'any'}
                options={maxPriceOptions}
                onChange={(v) => onChange('maxPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label={statusLabel}
                id="filter-status"
                options={statusFilterOptions}
                value={parseStatusFilter(filters.status)}
                onChange={(value) => onChange('status', value)}
                emptyLabel={statusEmptyLabel}
                icon={<ListFilter {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label={featuresLabel}
                id="filter-features"
                options={featureFilterOptions}
                value={parseFeaturesFilter(filters.features)}
                onChange={(value) => onChange('features', value)}
                emptyLabel={featuresEmptyLabel}
                icon={<Sparkles {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={deliveryDateLabel}
                value={filters.deliveryDate ?? ''}
                options={deliveryOptions}
                onChange={(v) => onChange('deliveryDate', v)}
                menuPlacement="top"
                icon={<Calendar {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={distanceToSeaLabel}
                value={filters.distanceToSea ?? ''}
                options={distanceOptions}
                onChange={(v) => onChange('distanceToSea', v)}
                menuPlacement="top"
                icon={<Waves {...filterFieldIcon} />}
              />
            </div>
          </div>
        </div>

        <div className="relative z-0 flex shrink-0 flex-col-reverse gap-4 border-t border-outline-variant/30 bg-surface-container-low px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <button
            type="button"
            onClick={() => {
              onClear()
            }}
            className="px-10 py-3 text-on-surface-variant font-label-nav text-label-nav uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary transition-colors cursor-pointer border border-outline-variant rounded-lg"
          >
            <RotateCcw size={18} />
            {clearFiltersLabel}
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-primary text-on-primary font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer"
          >
            <Search size={18} />
            {searchLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
