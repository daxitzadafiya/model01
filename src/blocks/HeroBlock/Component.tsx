'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, ChevronDown, Globe, Home, Search, Users } from 'lucide-react'
import type { Page } from '@/payload-types'
import { FilterSelect } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import DateRangePickerField from '@/components/PropertyList/DateRangePickerField'
import { CountFilterField } from '@/components/PropertyList/CountFilterField'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { HeroBackground } from '@/blocks/HeroBlock/HeroBackground'
import { HeroWeather } from '@/blocks/HeroBlock/HeroWeather'
import {
  applyPriceRangeValue,
  COUNT_FILTER_OTHER_VALUE,
  EMPTY_PROPERTY_FILTERS,
  hasAppliedPropertyFilters,
  parseCountryFilter,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from '@/components/PropertyList/filterOptions'
import {
  useGuestOptions,
  useHolidayBudgetOptions,
  usePriceRangeOptions,
} from '@/components/PropertyList/useFilterOptionLabels'
import {
  clearPendingPropertyListFilters,
  normalizePropertyListFilters,
  savePendingPropertyListFilters,
} from '@/components/PropertyList/propertyFilterUrl'
import { useCRMCoasts } from '@/hooks/useCRMCoasts'
import { useCRMCountries } from '@/hooks/useCRMCountries'
import { useCRMCities } from '@/hooks/useCRMCities'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import type { CRMListingPreset, PropertyListFilters } from '@/utilities/crmProperties'
import { DEFAULT_MAX_HOLIDAY_GUESTS, MIN_HOLIDAY_GUESTS } from '@/utilities/crmHoliday'
import { resolveDefaultCountryKeys } from '@/utilities/crmCountries'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { useRegisterHeroOverlay } from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'heroBlock' }>
type HeroPropertyTab = 'sale' | 'rental' | 'holiday'

const HERO_TAB_PATHS: Record<HeroPropertyTab, string> = {
  sale: '/property-for-sale',
  rental: '/property-for-rent',
  holiday: '/holiday-rentals',
}

const HERO_TAB_PRESETS: Record<HeroPropertyTab, CRMListingPreset> = {
  sale: 'forSale',
  rental: 'forRent',
  holiday: 'forHoliday',
}

const buttonClassName =
  'px-8 md:px-10 py-3 md:py-4 bg-tertiary rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary-container transition-all shadow-xl active:scale-95 reveal cursor-pointer text-white'

const heroSearchFormClassName =
  'rounded-xl md:rounded-2xl border border-white/25 bg-white/15 p-1.5 md:p-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl [&_label]:text-white/75 [&_.lucide-chevron-down]:text-white/70'

const heroSearchFieldClassName =
  'w-full pl-10 pr-10 py-2.5 md:py-3 bg-white/20 backdrop-blur-sm border border-white/30 focus:border-white/60 focus:ring-0 rounded-lg font-body-md text-body-md text-white text-left transition-colors'

const heroSearchButtonClassName =
  'w-full h-[46px] md:h-[50px] bg-tertiary hover:bg-tertiary-container transition-colors duration-300 text-white rounded-lg cursor-pointer font-label-nav text-label-nav uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg md:justify-self-end'

const heroDateFieldClassName =
  'w-full pl-10 pr-3 py-3 bg-white/20 backdrop-blur-sm border border-white/30 focus:border-white/60 focus:ring-0 rounded-lg font-body-md text-body-md text-white transition-colors [color-scheme:dark]'

const heroContainerClassName =
  'w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop'

const heroGridClassName: Record<HeroPropertyTab, string> = {
  sale: 'grid-cols-1 md:grid-cols-6',
  rental: 'grid-cols-1 md:grid-cols-5',
  holiday: 'grid-cols-1 md:grid-cols-6',
}

const HeroBlockContent: React.FC<Props> = (props) => {
  const {
    title,
    buttonText,
    ctaLink,
    searchResultsLink,
    showSearch,
    defaultPropertyTab,
    defaultCountry,
  } = props
  const ref = useReveal()
  useRegisterHeroOverlay()
  const router = useRouter()

  const saleTabLabel = useTranslation('hero.searchTabs.sale', 'Sale Properties')
  const rentalTabLabel = useTranslation('hero.searchTabs.rental', 'Rental Properties')
  const holidayTabLabel = useTranslation('hero.searchTabs.holiday', 'Holiday Properties')
  const countryLabel = useTranslation('propertyList.filters.country', 'Country')
  const allCountriesLabel = useTranslation(
    'propertyList.filters.country.emptyLabel',
    'All Countries',
  )
  const loadingCountriesLabel = useTranslation(
    'propertyList.filters.loadingCountries',
    'Loading countries…',
  )
  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const priceRangeLabel = useTranslation('propertyList.filters.priceRange', 'Price Range')
  const periodRangeLabel = useTranslation('propertyList.filters.periodRange', 'Stay period')
  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const totalBudgetLabel = useTranslation('propertyList.filters.totalBudget', 'Total Budget')
  const needMoreLabel = useTranslation('propertyList.filters.needMore', 'Need More')
  const guestsCustomPlaceholder = useTranslation(
    'propertyList.filters.guestsCustomPlaceholder',
    `1–${DEFAULT_MAX_HOLIDAY_GUESTS} Guests`,
  )
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const scrollLabel = useTranslation('hero.scrollIndicator', 'SCROLL')

  const initialTab = (defaultPropertyTab ?? 'sale') as HeroPropertyTab
  const [activeTab, setActiveTab] = useState<HeroPropertyTab>(initialTab)
  const [searchFilters, setSearchFilters] = useState<PropertyListFilters>({
    ...EMPTY_PROPERTY_FILTERS,
  })

  const listingPreset = HERO_TAB_PRESETS[activeTab]
  // Keep hero filter option APIs stable; do not re-fetch when switching tabs.
  const filterDataPreset: CRMListingPreset = 'forSale'
  const priceRangeOptions = usePriceRangeOptions()
  const guestOptions = useGuestOptions()
  const holidayBudgetOptions = useHolidayBudgetOptions()

  const guestsWithOther = useMemo(() => {
    const hasOther = guestOptions.some((option) => option.value === COUNT_FILTER_OTHER_VALUE)
    if (hasOther) return guestOptions
    return [...guestOptions, { value: COUNT_FILTER_OTHER_VALUE, label: needMoreLabel }]
  }, [guestOptions, needMoreLabel])

  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterDataPreset)
  const { countries, loading: countriesLoading } = useCRMCountries()
  const { coasts, loading: coastsLoading } = useCRMCoasts()
  const { cities, loading: citiesLoading } = useCRMCities(
    searchFilters.coast,
    coasts,
    filterDataPreset,
  )

  const countryOptions = useMemo(
    () => countries.map((item) => ({ value: item.value, label: item.label })),
    [countries],
  )

  const priceRange = resolvePriceRangeValue(
    searchFilters.minPrice,
    searchFilters.maxPrice,
    priceRangeOptions,
  )

  const defaultCountryAppliedRef = useRef(false)

  const resetFiltersForTab = useCallback(
    (tab: HeroPropertyTab) => {
      const nextFilters: PropertyListFilters = { ...EMPTY_PROPERTY_FILTERS }
      if (tab === 'sale' && countries.length) {
        nextFilters.country = resolveDefaultCountryKeys(defaultCountry, countries)
        defaultCountryAppliedRef.current = true
      }
      setSearchFilters(nextFilters)
    },
    [countries, defaultCountry],
  )

  // Apply CMS default country once when countries load — do not re-apply after the
  // user clears the selection (they may want "All Countries").
  useEffect(() => {
    if (defaultCountryAppliedRef.current || activeTab !== 'sale' || !countries.length) return
    const defaultKeys = resolveDefaultCountryKeys(defaultCountry, countries)
    defaultCountryAppliedRef.current = true
    if (!defaultKeys.length) return
    setSearchFilters((prev) => {
      if (prev.country?.length) return prev
      return { ...prev, country: defaultKeys }
    })
  }, [activeTab, countries, defaultCountry])

  const handleTabChange = (tab: HeroPropertyTab) => {
    setActiveTab(tab)
    resetFiltersForTab(tab)
  }

  const handleSearchFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuestsCustomChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      handleSearchFilterChange('guestsCustom', '')
      return
    }
    const parsed = Number(digits)
    if (!Number.isFinite(parsed)) {
      handleSearchFilterChange('guestsCustom', '')
      return
    }
    const clamped = Math.min(Math.max(parsed, MIN_HOLIDAY_GUESTS), DEFAULT_MAX_HOLIDAY_GUESTS)
    handleSearchFilterChange('guestsCustom', String(clamped))
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range, priceRangeOptions)
    setSearchFilters((prev) => ({ ...prev, minPrice, maxPrice }))
  }

  const searchResultsPath =
    activeTab === 'sale'
      ? (getCMSLinkHref(searchResultsLink ?? {}) ?? HERO_TAB_PATHS.sale)
      : HERO_TAB_PATHS[activeTab]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextFilters = normalizePropertyListFilters({
      ...EMPTY_PROPERTY_FILTERS,
      ...searchFilters,
    })
    // Only hand filters to the listing page when something is actually set.
    // Empty defaults should use the page's server-rendered listing.
    if (hasAppliedPropertyFilters(nextFilters)) {
      savePendingPropertyListFilters(nextFilters)
    } else {
      clearPendingPropertyListFilters()
    }
    router.push(searchResultsPath)
  }

  const linkProps =
    ctaLink && getCMSLinkHref(ctaLink)
      ? { ...ctaLink, label: buttonText || ctaLink.label }
      : { type: 'custom' as const, url: '/property-for-sale', label: buttonText }

  const tabs: { id: HeroPropertyTab; label: string }[] = [
    { id: 'sale', label: saleTabLabel },
    { id: 'rental', label: rentalTabLabel },
    { id: 'holiday', label: holidayTabLabel },
  ]

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
          <div
            className={`absolute bottom-[6%] md:bottom-[8%] left-0 right-0 z-30 ${heroContainerClassName}`}
          >
            <form onSubmit={handleSearchSubmit} className={heroSearchFormClassName}>
              <div className="flex flex-col gap-2 border-b border-white/20 px-4 py-2.5 md:px-6 md:py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex w-full flex-col gap-1 rounded-xl border border-white/20 bg-black/15 p-1.5 sm:w-auto md:inline-flex md:w-fit md:flex-row md:flex-wrap md:items-center md:gap-1 md:rounded-full md:p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'w-full cursor-pointer rounded-full px-4 py-2.5 text-left font-label-nav text-label-nav uppercase transition-all md:w-auto md:rounded-full md:px-5 md:py-2 md:text-center',
                        activeTab === tab.id
                          ? 'bg-tertiary text-white shadow-md'
                          : 'text-white/75 hover:bg-white/15 hover:text-white',
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="py-0.5 sm:py-0">
                  <HeroWeather />
                </div>
              </div>
              <div
                className={cn(
                  'grid gap-3 md:gap-4 p-3.5 md:p-6 items-end',
                  heroGridClassName[activeTab],
                )}
              >
                {activeTab === 'sale' && (
                  <FilterSelect
                    mode="multi"
                    label={countryLabel}
                    id="hero-search-country"
                    icon={<Globe size={20} strokeWidth={1.75} />}
                    options={countryOptions}
                    value={parseCountryFilter(searchFilters.country)}
                    onChange={(value) => handleSearchFilterChange('country', value)}
                    emptyLabel={countriesLoading ? loadingCountriesLabel : allCountriesLabel}
                    disabled={countriesLoading}
                    triggerClassName={heroSearchFieldClassName}
                  />
                )}

                <CoastCityFilterFields
                  coast={searchFilters.coast}
                  city={searchFilters.city}
                  onCoastChange={(value) => handleSearchFilterChange('coast', value)}
                  onCityChange={(value) => handleSearchFilterChange('city', value)}
                  coasts={coasts}
                  coastsLoading={coastsLoading}
                  cities={cities}
                  citiesLoading={citiesLoading}
                  coastId="hero-search-coast"
                  cityId="hero-search-city"
                  triggerClassName={heroSearchFieldClassName}
                />

                {(activeTab === 'sale' || activeTab === 'rental') && (
                  <>
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
                  </>
                )}

                {activeTab === 'holiday' && (
                  <>
                    <DateRangePickerField
                      id="hero-search-period-range"
                      label={periodRangeLabel}
                      periodFrom={searchFilters.periodFrom ?? ''}
                      periodTo={searchFilters.periodTo ?? ''}
                      onPeriodFromChange={(value) => handleSearchFilterChange('periodFrom', value)}
                      onPeriodToChange={(value) => handleSearchFilterChange('periodTo', value)}
                      triggerClassName={heroDateFieldClassName}
                      labelClassName="font-label-sm text-label-sm uppercase text-white/75 ml-1 mb-1 block"
                      iconClassName="text-tertiary pointer-events-none"
                      openDirection="up"
                      panelClassName="rounded-2xl border border-white/20 bg-surface shadow-2xl"
                    />
                    <CountFilterField
                      label={guestsLabel}
                      id="hero-search-guests"
                      icon={<Users size={20} strokeWidth={1.75} />}
                      options={guestsWithOther}
                      value={searchFilters.guests ?? 'any'}
                      customValue={searchFilters.guestsCustom ?? ''}
                      onChange={(value) => handleSearchFilterChange('guests', value)}
                      onCustomChange={handleGuestsCustomChange}
                      customPlaceholder={guestsCustomPlaceholder}
                      triggerClassName={heroSearchFieldClassName}
                      customInputClassName="text-white placeholder:text-white/90"
                    />
                    <FilterSelect
                      label={totalBudgetLabel}
                      id="hero-search-budget"
                      icon={<Banknote size={20} strokeWidth={1.75} />}
                      options={holidayBudgetOptions}
                      value={searchFilters.totalBudget ?? 'any'}
                      onChange={(value) => handleSearchFilterChange('totalBudget', value)}
                      triggerClassName={heroSearchFieldClassName}
                    />
                  </>
                )}

                <button type="submit" className={heroSearchButtonClassName}>
                  <Search size={16} />
                  {searchLabel}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden flex-col items-center animate-bounce text-white/70">
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
