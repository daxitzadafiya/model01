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
  BEDROOM_OPTIONS,
  DELIVERY_OPTIONS,
  DISTANCE_OPTIONS,
  FEATURE_FILTER_OPTIONS,
  parseFeaturesFilter,
  MAX_PRICE_OPTIONS,
  MIN_PRICE_OPTIONS,
  STATUS_FILTER_OPTIONS,
  parseLocationFilter,
  parsePropertyTypeFilter,
  parseStatusFilter,
} from './filterOptions'

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
        aria-label="Close filters"
        className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 md:px-8 py-5">
          <h2 id="more-filters-title" className="font-headline-sm text-headline-sm text-on-surface">
            More Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 py-6 font-body-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} htmlFor="filter-reference">
                Reference
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
                  placeholder="Reference..."
                  value={filters.reference ?? ''}
                  onChange={(e) => onChange('reference', e.target.value)}
                  className={modalInputClass}
                />
              </div>
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label="Property Type"
                options={propertyTypeOptions}
                value={parsePropertyTypeFilter(filters.propertyType)}
                onChange={(value) => onChange('propertyType', value)}
                emptyLabel={propertyTypeLoading ? 'Loading types…' : 'All Properties'}
                disabled={propertyTypeLoading}
                icon={<Home {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <LocationFilterSelect
                label="Location"
                tree={locationTree}
                value={parseLocationFilter(filters.location)}
                onChange={(value) => onChange('location', value)}
                placeholder="Location"
                emptyLabel="Location"
                loading={locationLoading}
                disabled={locationLoading}
                icon={<MapPin {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label="Bedrooms"
                value={filters.bedrooms ?? 'any'}
                options={BEDROOM_OPTIONS}
                onChange={(v) => onChange('bedrooms', v)}
                icon={<Bed {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label="Min Price"
                value={filters.minPrice ?? 'any'}
                options={MIN_PRICE_OPTIONS}
                onChange={(v) => onChange('minPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label="Max Price"
                value={filters.maxPrice ?? 'any'}
                options={MAX_PRICE_OPTIONS}
                onChange={(v) => onChange('maxPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label="Status"
                id="filter-status"
                options={STATUS_FILTER_OPTIONS}
                value={parseStatusFilter(filters.status)}
                onChange={(value) => onChange('status', value)}
                emptyLabel="Status"
                icon={<ListFilter {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label="Features"
                id="filter-features"
                options={FEATURE_FILTER_OPTIONS}
                value={parseFeaturesFilter(filters.features)}
                onChange={(value) => onChange('features', value)}
                emptyLabel="Features"
                icon={<Sparkles {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label="Delivery Date"
                value={filters.deliveryDate ?? ''}
                options={DELIVERY_OPTIONS}
                onChange={(v) => onChange('deliveryDate', v)}
                menuPlacement="top"
                icon={<Calendar {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label="Distance to the Sea"
                value={filters.distanceToSea ?? ''}
                options={DISTANCE_OPTIONS}
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
            className="text-on-surface-variant font-label-nav text-label-nav uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary transition-colors cursor-pointer"
          >
            <RotateCcw size={18} />
            Clear Filters
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-primary text-on-primary font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer"
          >
            <Search size={18} />
            Search
          </button>
        </div>
      </form>
    </div>
  )
}
