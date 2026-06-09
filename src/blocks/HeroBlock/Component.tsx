'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, ChevronDown, Home, MapPin, Search } from 'lucide-react'
import type { Page } from '@/payload-types'
import { FilterSelect } from '@/components/FilterSelect'
import { LocationFilterSelect } from '@/components/LocationFilterSelect'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { Media } from '@/components/Media'
import {
  applyPriceRangeValue,
  EMPTY_PROPERTY_FILTERS,
  hasActivePropertyFilters,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from '@/components/PropertyList/filterOptions'
import { usePriceRangeOptions } from '@/components/PropertyList/useFilterOptionLabels'
import { buildPropertyListUrl } from '@/components/PropertyList/propertyFilterUrl'
import { useCRMLocationTree } from '@/hooks/useCRMLocationTree'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import type { PropertyListFilters } from '@/utilities/crmProperties'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'

const PROPERTY_FOR_SALE_PATH = '/property-for-sale'

type Props = Extract<Page['layout'][0], { blockType: 'heroBlock' }>

const buttonClassName =
  'px-8 md:px-10 py-3 md:py-4 bg-tertiary rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary-container transition-all shadow-xl active:scale-95 reveal cursor-pointer text-white'

export const HeroBlock: React.FC<Props> = ({
  title,
  buttonText,
  ctaLink,
  backgroundImage,
  showSearch,
}) => {
  const ref = useReveal()
  const router = useRouter()
  const searchPropertiesLabel = useTranslation(
    'propertyList.filters.searchProperties',
    'Search Properties',
  )
  const locationLabel = useTranslation('propertyList.filters.location', 'Location')
  const locationPlaceholder = useTranslation('propertyList.filters.location.placeholder', 'Athens, Cyclades...')
  const locationEmptyLabel = useTranslation('propertyList.filters.location.emptyLabel', 'All Locations')
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
  const priceRange = resolvePriceRangeValue(searchFilters.minPrice, searchFilters.maxPrice)

  const handleSearchFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range)
    setSearchFilters((prev) => ({ ...prev, minPrice, maxPrice }))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasActivePropertyFilters(searchFilters)) return
    router.push(buildPropertyListUrl(PROPERTY_FOR_SALE_PATH, searchFilters))
  }

  const linkProps =
    ctaLink && getCMSLinkHref(ctaLink)
      ? { ...ctaLink, label: buttonText || ctaLink.label }
      : { type: 'custom' as const, url: '/property-for-sale', label: buttonText }

  return (
    <div ref={ref}>
      <section className="relative min-h-dvh md:h-screen w-full overflow-hidden">
        <div className="absolute inset-0 hero-gradient z-10"></div>
        {typeof backgroundImage === 'object' && backgroundImage !== null && (
          <div className="absolute inset-0 w-full h-full object-cover">
            <Media resource={backgroundImage} fill priority imgClassName="object-cover" />
          </div>
        )}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop pt-20 pb-32 md:pt-8 md:pb-0">
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-white max-w-4xl mb-6 md:mb-8 reveal">
            {title}
          </h1>
          <CMSLink {...linkProps} appearance="inline" className={buttonClassName} />
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden  flex-col items-center animate-bounce text-white/70 md:hidden sm:hidden">
          <span className="font-label-sm text-label-sm mb-2">{scrollLabel}</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Floating Search */}
      {showSearch && (
        <div className="relative z-30 max-w-5xl mx-auto -mt-10 md:-mt-16 px-margin-mobile md:px-margin-desktop">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-surface-container-lowest p-2 rounded-xl md:rounded-2xl shadow-2xl"
          >
            <div className="flex border-b border-outline-variant/30 px-4 md:px-6">
              <p className="py-3 uppercase md:py-4 px-4 md:px-6 font-label-nav text-label-nav text-primary border-b-2 border-tertiary">
                {searchPropertiesLabel}
              </p>
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
                triggerClassName="w-full pl-10 pr-10 py-3 bg-surface-container border border-outline-variant focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface text-left"
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
                triggerClassName="w-full pl-10 pr-10 py-3 bg-surface-container border border-outline-variant focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface text-left"
              />

              <FilterSelect
                label={priceRangeLabel}
                id="hero-search-price"
                icon={<Banknote size={20} strokeWidth={1.75} />}
                options={priceRangeOptions}
                value={priceRange}
                onChange={handlePriceRangeChange}
                triggerClassName="w-full pl-10 pr-10 py-3 bg-surface-container border border-outline-variant focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface text-left"
              />

              <button
                type="submit"
                className="w-full h-[50px] bg-primary  hover:text-on-tertiary transition-colors duration-300 text-white rounded-lg cursor-pointer font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary flex items-center justify-center gap-2"
              >
                <Search size={16} />
                {searchLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
