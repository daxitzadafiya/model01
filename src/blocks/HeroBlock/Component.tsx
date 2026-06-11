'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, ChevronDown, Home, MapPin, Search } from 'lucide-react'
import type { Page } from '@/payload-types'
import { FilterSelect } from '@/components/FilterSelect'
import { LocationFilterSelect } from '@/components/LocationFilterSelect'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { HeroBackground } from '@/blocks/HeroBlock/HeroBackground'
import { HeroWeather } from '@/blocks/HeroBlock/HeroWeather'
import {
  applyPriceRangeValue,
  EMPTY_PROPERTY_FILTERS,
  hasActivePropertyFilters,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from '@/components/PropertyList/filterOptions'
import { usePriceRangeOptions } from '@/components/PropertyList/useFilterOptionLabels'
import { savePendingPropertyListFilters } from '@/components/PropertyList/propertyFilterUrl'
import { useCRMLocationTree } from '@/hooks/useCRMLocationTree'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import type { PropertyListFilters } from '@/utilities/crmProperties'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { useRegisterHeroOverlay } from '@/providers/HeroOverlay'

const ALL_PROPERTIES_PATH = '/all-properties'

type Props = Extract<Page['layout'][0], { blockType: 'heroBlock' }>

const buttonClassName =
  'px-8 md:px-10 py-3 md:py-4 bg-tertiary rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary-container transition-all shadow-xl active:scale-95 reveal cursor-pointer text-white'

const heroSearchFormClassName =
  'rounded-xl md:rounded-2xl border border-white/25 bg-white/15 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl [&_label]:text-white/75 [&_.lucide-chevron-down]:text-white/70'

const heroSearchFieldClassName =
  'w-full pl-10 pr-10 py-3 bg-white/20 backdrop-blur-sm border border-white/30 focus:border-white/60 focus:ring-0 rounded-lg font-body-md text-body-md text-white text-left transition-colors'

const heroSearchButtonClassName =
  'w-full h-[50px] bg-tertiary hover:bg-tertiary-container transition-colors duration-300 text-white rounded-lg cursor-pointer font-label-nav text-label-nav uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg'

const heroContainerClassName =
  'w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop'

const HeroBlockContent: React.FC<Props> = (props) => {
  const { title, buttonText, ctaLink, showSearch } = props
  const ref = useReveal()
  useRegisterHeroOverlay()
  const router = useRouter()
  const searchPropertiesLabel = useTranslation(
    'propertyList.filters.searchProperties',
    'Search Properties',
  )
  const locationLabel = useTranslation('propertyList.filters.location', 'Location')
  const locationPlaceholder = useTranslation(
    'propertyList.filters.location.placeholder',
    'Athens, Cyclades...',
  )
  const locationEmptyLabel = useTranslation(
    'propertyList.filters.location.emptyLabel',
    'All Locations',
  )
  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const priceRangeLabel = useTranslation('propertyList.filters.priceRange', 'Price Range')
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const scrollLabel = useTranslation('hero.scrollIndicator', 'SCROLL')
  const priceRangeOptions = usePriceRangeOptions()
  const [searchFilters, setSearchFilters] = useState<PropertyListFilters>({
    ...EMPTY_PROPERTY_FILTERS,
  })
  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions('forSale')
  const { tree: locationTree, loading: locationLoading } = useCRMLocationTree('forSale')
  const priceRange = resolvePriceRangeValue(
    searchFilters.minPrice,
    searchFilters.maxPrice,
    priceRangeOptions,
  )

  const handleSearchFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range, priceRangeOptions)
    setSearchFilters((prev) => ({ ...prev, minPrice, maxPrice }))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasActivePropertyFilters(searchFilters)) return
    savePendingPropertyListFilters(searchFilters)
    router.push(ALL_PROPERTIES_PATH)
  }

  const linkProps =
    ctaLink && getCMSLinkHref(ctaLink)
      ? { ...ctaLink, label: buttonText || ctaLink.label }
      : { type: 'custom' as const, url: '/property-for-sale', label: buttonText }

  return (
    <div ref={ref} className="relative">
      <section className="relative h-dvh w-full overflow-hidden flex items-center justify-center bg-black">
        <div className="absolute inset-0 z-0">
          <HeroBackground {...props} />
        </div>
        <div className="absolute inset-0 hero-gradient z-10" aria-hidden />
        <div
          className={`relative z-20 flex w-full flex-col items-center justify-center text-center -translate-y-8 md:-translate-y-12 ${heroContainerClassName} pt-20 pb-16 md:pt-24 md:pb-20`}
        >
          <div className="flex w-full max-w-4xl flex-col items-center">
            <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-white text-center w-full mb-6 md:mb-8 reveal">
              {title}
            </h1>
            <CMSLink {...linkProps} appearance="inline" className={buttonClassName} />
          </div>
        </div>

        {showSearch && (
          <div className={`absolute bottom-[6%] md:bottom-[8%] left-0 right-0 z-30 ${heroContainerClassName}`}>
            <form
              onSubmit={handleSearchSubmit}
              className={heroSearchFormClassName}
            >
              <div className="flex flex-col gap-2 border-b border-white/20 px-4 md:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="py-3 uppercase md:py-4 px-4 md:px-6 font-label-nav text-label-nav text-white border-b-2 border-tertiary self-start">
                  {searchPropertiesLabel}
                </p>
                <HeroWeather />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-6 items-end">
                <LocationFilterSelect
                  label={locationLabel}
                  id="hero-search-location"
                  icon={<MapPin size={20} strokeWidth={1.75} />}
                  tree={locationTree}
                  value={searchFilters.location ?? []}
                  onChange={(value) => handleSearchFilterChange('location', value)}
                  placeholder={locationPlaceholder}
                  emptyLabel={locationEmptyLabel}
                  loading={locationLoading}
                  disabled={locationLoading}
                  triggerClassName={heroSearchFieldClassName}
                />

                <FilterSelect
                  mode="multi"
                  label={propertyTypeLabel}
                  id="hero-search-type"
                  icon={<Home size={20} strokeWidth={1.75} />}
                  options={propertyTypeOptions}
                  value={parsePropertyTypeFilter(searchFilters.propertyType)}
                  onChange={(value) => handleSearchFilterChange('propertyType', value)}
                  emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
                  disabled={propertyTypeLoading}
                  triggerClassName={heroSearchFieldClassName}
                />

                <FilterSelect
                  label={priceRangeLabel}
                  id="hero-search-price"
                  icon={<Banknote size={20} strokeWidth={1.75} />}
                  options={priceRangeOptions}
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  triggerClassName={heroSearchFieldClassName}
                />

                <button
                  type="submit"
                  className={heroSearchButtonClassName}
                >
                  <Search size={16} />
                  {searchLabel}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden  flex-col items-center animate-bounce text-white/70">
          <span className="font-label-sm text-label-sm mb-2">{scrollLabel}</span>
          <ChevronDown size={20} />
        </div>
      </section>
    </div>
  )
}

export const HeroBlock: React.FC<Props> = (props) => (
  <PropertyFilterOptionsProvider>
    <HeroBlockContent {...props} />
  </PropertyFilterOptionsProvider>
)
