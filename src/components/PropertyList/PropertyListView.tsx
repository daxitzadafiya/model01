'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useSiteLocale } from '@/utilities/useSiteLocale'

import { FilterSelect } from '@/components/FilterSelect'
import { PropertyMapModal } from '@/components/PropertyMap/PropertyMapModal'
import { ArrowUpDown } from 'lucide-react'
import { useCRMCoasts } from '@/hooks/useCRMCoasts'
import { useCRMCountries } from '@/hooks/useCRMCountries'
import { useCRMCities } from '@/hooks/useCRMCities'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { resolvePropertyDetailFetchStatuses } from '@/utilities/propertyDetailFetchStatus'
import { PropertyCardSkeleton } from '@/components/PropertyCard/PropertyCardSkeleton'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import {
  buildCRMListingQuery,
  fetchCRMProperties,
  fetchCRMPropertiesPost,
  hasHolidayListingFilters,
  shouldUseCRMPropertiesPost,
  normalizeCRMListProperty,
  resolveListingModeFromPreset,
  type CRMListingPreset,
  type PropertyListFilters,
} from '@/utilities/crmProperties'
import {
  buildCRMProjectsQuery,
  fetchCRMProjects,
  normalizeCRMProject,
} from '@/utilities/crmProjects'
import { ProjectCard } from '@/components/ProjectCard'
import { hasMapAreaReferences } from '@/utilities/propertyMapFilters'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import { EMPTY_PROPERTY_FILTERS, hasAppliedPropertyFilters } from './filterOptions'
import { useSortOptions } from './useFilterOptionLabels'
import { PropertyListFilters as FiltersBar } from './PropertyListFilters'
import { PropertyListPagination } from './PropertyListPagination'
import {
  clearPendingPropertyListFilters,
  normalizePropertyListFilters,
  stripPropertyFilterSearchParams,
  takePendingPropertyListFilters,
  appendListingContextToDetailHref,
} from './propertyFilterUrl'
import {
  listingPresetToDetailContext,
  type PropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'
import { resolveHolidayGuestsFilterCount } from '@/utilities/crmHoliday'
import {
  buildPropertyListListingHref,
  parseOrderbyEntriesFromSearchParams,
  parsePropertyListPage,
  parsePropertyListSort,
  stripOrderbyFromListingHref,
} from './propertyListUrl'
import type { PropertyListInitialData } from './PropertyListServerData'
import { useTranslation } from '@/utilities/translateClient'

export type { PropertyListInitialData } from './PropertyListServerData'

type Props = {
  listingPreset: CRMListingPreset
  pageSize?: number | null
  showFilters?: boolean | null
  showMap?: boolean | null
  forceSoldBadge?: boolean | null
  resultsLabel?: string | null
  emptyStateNoFavoritesTitle?: string | null
  emptyStateNoFavoritesDescription?: string | null
  emptyStateNoResultsTitle?: string | null
  emptyStateNoResultsDescription?: string | null
  initialData?: PropertyListInitialData | null
  listingKey?: string
  /** Default listing pages: server fetch + URL pagination (filters/favorites stay client-driven). */
  serverManaged?: boolean
}

const DEFAULT_PAGE_SIZE = 9
const FALLBACK_SORT_OPTIONS = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions
const FALLBACK_DEFAULT_SORT = FALLBACK_SORT_OPTIONS[0]?.value ?? 'recent'

export const PropertyListView: React.FC<Props> = (props) => (
  <PropertyFilterOptionsProvider>
    <PropertyListViewInner {...props} />
  </PropertyFilterOptionsProvider>
)

const PropertyListViewInner: React.FC<Props> = ({
  listingPreset,
  pageSize: pageSizeProp,
  showFilters = true,
  showMap = false,
  forceSoldBadge,
  resultsLabel,
  emptyStateNoFavoritesTitle,
  emptyStateNoFavoritesDescription,
  emptyStateNoResultsTitle,
  emptyStateNoResultsDescription,
  initialData,
  listingKey = '',
  serverManaged = false,
}) => {
  const pageSize = Math.max(1, pageSizeProp ?? DEFAULT_PAGE_SIZE)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeLocale = useSiteLocale()
  const sortOptions = useSortOptions()
  const [isNavigating, startTransition] = useTransition()

  const [pendingFiltersApplied, setPendingFiltersApplied] = useState(false)
  const [filtersHydrated, setFiltersHydrated] = useState(false)
  const [filters, setFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [mapModalOpen, setMapModalOpen] = useState(false)

  const { favoriteIds } = usePropertyFavorites()
  const isFavoritesList = listingPreset === 'favorites'
  const filtersAreApplied = hasAppliedPropertyFilters(appliedFilters)

  const sortOptionsForUrl = sortOptions.length ? sortOptions : FALLBACK_SORT_OPTIONS
  const defaultListSort = sortOptionsForUrl[0]?.value ?? FALLBACK_DEFAULT_SORT
  const sortFromUrl = useMemo(
    () => parsePropertyListSort(searchParams, FALLBACK_DEFAULT_SORT, sortOptionsForUrl),
    [searchParams, sortOptionsForUrl],
  )

  const [page, setPage] = useState(initialData?.page ?? parsePropertyListPage(searchParams))
  const [sort, setSort] = useState(initialData?.sort ?? sortFromUrl ?? FALLBACK_DEFAULT_SORT)
  const [rawProperties, setRawProperties] = useState<Record<string, unknown>[]>(
    initialData?.properties ?? [],
  )
  const [total, setTotal] = useState(initialData?.total ?? 0)

  const isServerManaged =
    serverManaged &&
    !isFavoritesList &&
    !filtersAreApplied &&
    !pendingFiltersApplied &&
    sort === defaultListSort

  const [loading, setLoading] = useState(isServerManaged ? !initialData : !initialData)
  const serverDataReady =
    Boolean(initialData) &&
    (!listingKey || !initialData?.listingKey || initialData.listingKey === listingKey)
  const showSkeleton =
    loading || (isServerManaged && isNavigating) || (isServerManaged && !serverDataReady)

  const filterPreset = isFavoritesList ? 'forSale' : listingPreset
  const mapEnabled = showMap === true
  const hasFavoriteIds = favoriteIds.length > 0
  const favoriteIdsKey = JSON.stringify(favoriteIds)

  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterPreset)
  const { countries, loading: countriesLoading } = useCRMCountries()
  const { coasts, loading: coastsLoading } = useCRMCoasts()
  const { cities, loading: citiesLoading } = useCRMCities(filters.coast, coasts, filterPreset)
  const sortParams = useMemo(
    () => sortOptions.find((option) => option.value === sort)?.sort,
    [sort, sortOptions],
  )
  const sortParamsKey = useMemo(() => JSON.stringify(sortParams ?? {}), [sortParams])
  const stableSortParams = useMemo<Record<string, unknown> | undefined>(() => {
    if (sortParamsKey === '{}' || !sortParamsKey) return undefined
    try {
      return JSON.parse(sortParamsKey) as Record<string, unknown>
    } catch {
      return undefined
    }
  }, [sortParamsKey])

  const favoritesSyncReadyRef = useRef(false)
  const pageAdjustedByFavoritesSyncRef = useRef(false)
  const fetchGenerationRef = useRef(0)
  const orderbyStrippedRef = useRef(false)

  const displayTotal =
    isFavoritesList && hasFavoriteIds && !filtersAreApplied ? favoriteIds.length : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize))

  const getListingHref = useCallback(
    (updates: { page?: number; sort?: string | null }) =>
      buildPropertyListListingHref(pathname, updates, searchParams, sortOptionsForUrl),
    [pathname, searchParams, sortOptionsForUrl],
  )

  const navigateServerListing = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      setLoading(true)
      startTransition(() => {
        router.push(href, { scroll: options?.scroll ?? false })
      })
    },
    [router],
  )

  const properties = useMemo(() => {
    const listingMode = resolveListingModeFromPreset(listingPreset)
    const isHolidayList = listingPreset === 'forHoliday' || hasHolidayListingFilters(appliedFilters)
    const isProjectsList = listingPreset === 'projects'
    const holidayGuestCount = resolveHolidayGuestsFilterCount(
      appliedFilters.guests,
      appliedFilters.guestsCustom,
    )

    return rawProperties.map((raw) =>
      normalizeCRMListProperty(raw, activeLocale, {
        listingMode,
        projectListing: isProjectsList,
        holidayListing: isHolidayList,
        holidayPeriodFrom: appliedFilters.periodFrom,
        holidayPeriodTo: appliedFilters.periodTo,
        holidayGuests: holidayGuestCount != null ? String(holidayGuestCount) : undefined,
      }),
    )
  }, [activeLocale, appliedFilters, listingPreset, rawProperties])

  const projects = useMemo(() => {
    if (listingPreset !== 'projects') return []
    return rawProperties.map((raw) => normalizeCRMProject(raw, activeLocale))
  }, [activeLocale, listingPreset, rawProperties])

  const detailListingContext: PropertyDetailListingContext | undefined =
    listingPresetToDetailContext(listingPreset)

  const sortByLabel = useTranslation('propertyList.filters.sortBy', 'Sort by')
  const showingLabel = useTranslation('propertyList.results.showing', 'Showing')
  const defaultResultsLabel = useTranslation(
    'propertyList.results.extraordinaryProperties',
    'extraordinary properties',
  )
  const favoritesEyebrow = useTranslation('propertyList.emptyState.favoritesEyebrow', 'Favorites')
  const collectionsEyebrow = useTranslation(
    'propertyList.emptyState.collectionsEyebrow',
    'Collections',
  )
  const noFavoritesTitle = useTranslation(
    'propertyList.emptyState.noFavoritesTitle',
    'No favorites yet',
  )
  const noFavoritesDescription = useTranslation(
    'propertyList.emptyState.noFavoritesDescription',
    "You haven't favorited any properties yet. Browse our listings and tap the heart on any property to save it here.",
  )
  const noMatchingFavoritesTitle = useTranslation(
    'propertyList.emptyState.noMatchingFavoritesTitle',
    'No matching favorites',
  )
  const noMatchingFavoritesDescription = useTranslation(
    'propertyList.emptyState.noMatchingFavoritesDescription',
    'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.',
  )
  const noPropertiesTitle = useTranslation(
    'propertyList.emptyState.noPropertiesTitle',
    'No properties found',
  )
  const noPropertiesDescription = useTranslation(
    'propertyList.emptyState.noPropertiesDescription',
    'We could not find any listings for this selection. Try adjusting your filters or check again soon.',
  )
  const noProjectsTitle = useTranslation(
    'propertyList.emptyState.noProjectsTitle',
    'No projects found',
  )
  const noProjectsDescription = useTranslation(
    'propertyList.emptyState.noProjectsDescription',
    'We could not find any projects for this selection. Try adjusting your filters or check again soon.',
  )
  const isProjectsList = listingPreset === 'projects'
  const emptyResultsTitle = isProjectsList ? noProjectsTitle : noPropertiesTitle
  const emptyResultsDescription = isProjectsList ? noProjectsDescription : noPropertiesDescription

  /** Apply server-rendered listing (page, sort, properties). */
  useEffect(() => {
    if (!isServerManaged) return

    if (!initialData || !serverDataReady) {
      setLoading(true)
      return
    }

    setPage(initialData.page)
    setSort(initialData.sort || sortFromUrl || FALLBACK_DEFAULT_SORT)
    setRawProperties(initialData.properties)
    setTotal(initialData.total)
    setLoading(false)
  }, [initialData, isServerManaged, serverDataReady, sortFromUrl])

  /** Remove orderby[] from the URL — sort is kept in component state only. */
  useEffect(() => {
    if (orderbyStrippedRef.current) return

    const orderbyEntries = parseOrderbyEntriesFromSearchParams(searchParams)
    if (!orderbyEntries.length) {
      orderbyStrippedRef.current = true
      return
    }

    const fromUrl = parsePropertyListSort(searchParams, FALLBACK_DEFAULT_SORT, sortOptionsForUrl)
    setSort(fromUrl)
    orderbyStrippedRef.current = true
    router.replace(stripOrderbyFromListingHref(pathname, searchParams), { scroll: false })
  }, [pathname, router, searchParams, sortOptionsForUrl])

  /** Hero search → listing: sessionStorage filters (client fetch only). */
  useEffect(() => {
    const pending = takePendingPropertyListFilters()
    // Default/empty hero searches must stay on the server-rendered listing.
    // Treating them as "pending" disables server mode without triggering a
    // client fetch (filtersAreApplied is false), which yields 0 results.
    if (pending && hasAppliedPropertyFilters(pending)) {
      setPendingFiltersApplied(true)
      setFilters(pending)
      setAppliedFilters(pending)
      setPage(1)
      // Avoid showing the server-prefetched default list while we fetch
      // using the Hero-selected pending filters.
      setRawProperties([])
      setTotal(0)
      setLoading(true)
    } else if (pending) {
      clearPendingPropertyListFilters()
    }
    stripPropertyFilterSearchParams()
    setFiltersHydrated(true)
  }, [])

  /** Client CRM fetch — favorites and filtered listings only. */
  useEffect(() => {
    if (!filtersHydrated || isServerManaged) return

    if (isFavoritesList && favoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const sortTriggersClientFetch =
      sort !== defaultListSort ||
      filtersAreApplied ||
      hasMapAreaReferences(appliedFilters) ||
      (isFavoritesList && favoriteIds.length > 0)

    if (!sortTriggersClientFetch) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const generation = ++fetchGenerationRef.current

    const load = async () => {
      const showSkeleton = !(isFavoritesList && pageAdjustedByFavoritesSyncRef.current)
      pageAdjustedByFavoritesSyncRef.current = false
      if (showSkeleton) setLoading(true)

      try {
        if (listingPreset === 'projects') {
          const listingBody = buildCRMProjectsQuery({
            page,
            pageSize,
            filters: appliedFilters,
            sortParams: stableSortParams,
          })
          const result = await fetchCRMProjects({
            body: listingBody,
            signal: controller.signal,
            locale: activeLocale,
            projectIds: hasMapAreaReferences(appliedFilters)
              ? appliedFilters.mapReferences
              : undefined,
          })
          if (controller.signal.aborted || generation !== fetchGenerationRef.current) return

          setRawProperties(result.properties as Record<string, unknown>[])
          setTotal(result.total)
        } else {
          const usePostListing = shouldUseCRMPropertiesPost({
            filters: appliedFilters,
            preset: listingPreset,
            favoriteIds: isFavoritesList ? favoriteIds : undefined,
          })
          const listingBody = buildCRMListingQuery({
            preset: listingPreset,
            page,
            pageSize,
            filters: appliedFilters,
            restrictToFavoriteIds: isFavoritesList ? favoriteIds : undefined,
            sortParams: stableSortParams,
          })
          const postReason = isFavoritesList
            ? 'favorites'
            : hasMapAreaReferences(appliedFilters)
              ? 'map-area'
              : listingPreset === 'forHoliday' || hasHolidayListingFilters(appliedFilters)
                ? 'holiday'
                : undefined
          const result = usePostListing
            ? await fetchCRMPropertiesPost({
                body: listingBody,
                signal: controller.signal,
                reason: postReason,
              })
            : await fetchCRMProperties({ body: listingBody, signal: controller.signal })
          if (controller.signal.aborted || generation !== fetchGenerationRef.current) return

          setRawProperties(result.properties as Record<string, unknown>[])
          setTotal(result.total)
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load property list', error)
          if (generation === fetchGenerationRef.current) {
            setRawProperties([])
            setTotal(0)
          }
        }
      } finally {
        if (generation === fetchGenerationRef.current) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [
    activeLocale,
    appliedFilters,
    favoriteIds,
    filtersHydrated,
    isFavoritesList,
    isServerManaged,
    listingPreset,
    page,
    pageSize,
    sort,
    sortParamsKey,
    stableSortParams,
    defaultListSort,
    filtersAreApplied,
  ])

  /** Favorites: adjust page after unfavoriting. */
  useEffect(() => {
    if (!isFavoritesList || isServerManaged) {
      favoritesSyncReadyRef.current = false
      return
    }

    if (!favoritesSyncReadyRef.current) {
      favoritesSyncReadyRef.current = true
      return
    }

    if (favoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const lastValidPage = Math.max(1, Math.ceil(favoriteIds.length / pageSize))
    if (page > lastValidPage) {
      pageAdjustedByFavoritesSyncRef.current = true
      setPage(lastValidPage)
    }
  }, [favoriteIdsKey, isFavoritesList, isServerManaged, page, pageSize])

  const handleFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = (nextFilters: PropertyListFilters) => {
    clearPendingPropertyListFilters()
    const normalized = normalizePropertyListFilters({
      ...filters,
      ...nextFilters,
    })
    const nextFiltersApplied = hasAppliedPropertyFilters(normalized)
    // Drop hero-pending mode so Clear can return to the default server listing.
    // Leaving this true after empty filters skips the default fetch and keeps stale results.
    setPendingFiltersApplied(false)
    setFilters(normalized)
    setAppliedFilters(normalized)
    setPage(1)
    setLoading(true)

    const willBeServerManaged =
      serverManaged && !isFavoritesList && !nextFiltersApplied && sort === defaultListSort

    if (willBeServerManaged || isServerManaged) {
      router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
    }
  }

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort)
    setPage(1)
    setLoading(true)
    router.replace(getListingHref({ page: 1 }), { scroll: false })
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return

    if (isServerManaged) {
      navigateServerListing(getListingHref({ page: nextPage }), { scroll: true })
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      return
    }

    setPage(nextPage)
    setLoading(true)
    router.replace(getListingHref({ page: nextPage }), { scroll: false })
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  const handleMapDrawApply = (references: string[]) => {
    const nextFilters: PropertyListFilters = {
      ...appliedFilters,
      mapReferences: references,
      reference: '',
    }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(1)
    setLoading(true)
    if (isServerManaged) {
      router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
    }
  }

  const resultsText = useMemo(() => {
    const label = resultsLabel || defaultResultsLabel
    return (
      <>
        {showingLabel}{' '}
        <span className="font-bold text-on-surface">{showSkeleton ? '…' : displayTotal}</span>{' '}
        {label}
      </>
    )
  }, [displayTotal, showSkeleton, resultsLabel, showingLabel, defaultResultsLabel])

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
      {showFilters !== false && (
        <FiltersBar
          listingPreset={listingPreset}
          filters={filters}
          appliedFilters={appliedFilters}
          onChange={handleFilterChange}
          onApply={handleApply}
          showMap={mapEnabled}
          onOpenMap={() => setMapModalOpen(true)}
          propertyTypeOptions={propertyTypeOptions}
          propertyTypeLoading={propertyTypeLoading}
          countries={countries}
          countriesLoading={countriesLoading}
          coasts={coasts}
          coastsLoading={coastsLoading}
          cities={cities}
          citiesLoading={citiesLoading}
        />
      )}

      <section className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
        <div className="font-body-lg text-body-lg text-on-surface-variant">{resultsText}</div>
        <FilterSelect
          label={sortByLabel}
          id="property-list-sort"
          icon={<ArrowUpDown size={20} strokeWidth={1.75} />}
          options={sortOptions}
          value={sort}
          onChange={(value) => handleSortChange(value)}
          className="w-full md:w-auto md:min-w-[220px]"
        />
      </section>

      {isFavoritesList && !hasFavoriteIds ? (
        <div className="mb-20">
          <SectionEmptyState
            eyebrow={favoritesEyebrow}
            title={emptyStateNoFavoritesTitle || noFavoritesTitle}
            description={emptyStateNoFavoritesDescription || noFavoritesDescription}
            tone="surface"
          />
        </div>
      ) : showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {Array.from({ length: pageSize }).map((_, i) => (
            <PropertyCardSkeleton key={i} animationDelay={(i % 3) * 0.12} />
          ))}
        </div>
      ) : listingPreset === 'projects' && projects.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {projects.map((project) => (
            <ProjectCard
              key={project.id ?? project.reference ?? project.title}
              projectId={project.id}
              href={project.detailHref}
              project={project}
            />
          ))}
        </section>
      ) : properties.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {properties.map((property) => (
            <PropertyCard
              key={property.id ?? property.reference ?? property.title}
              propertyId={property.id}
              href={appendListingContextToDetailHref(
                property.detailHref,
                detailListingContext,
                appliedFilters,
              )}
              detailListingContext={detailListingContext}
              property={{
                imageUrl: property.imageUrl,
                imageUrls: property.imageUrls,
                location: property.location,
                city: property.city,
                reference: property.reference,
                title: property.title,
                beds: property.beds,
                baths: property.baths,
                sqft: property.sqft,
                price: property.price,
                priceSubtext: property.holidayPriceSummary,
                statusBadgeLabel: property.statusBadgeLabel,
              }}
              statusBadgeLabel={resolvePropertyCardStatusBadge({
                statusBadgeLabel: property.statusBadgeLabel,
                forceSoldBadge: Boolean(forceSoldBadge),
                useCrmStatus: true,
              })}
              detailFetchStatuses={resolvePropertyDetailFetchStatuses({
                crmStatus: property.crmStatus,
                statusBadgeLabel: property.statusBadgeLabel,
                forceSold: Boolean(forceSoldBadge),
              })}
              variant="surface"
            />
          ))}
        </section>
      ) : (
        <div className="mb-20">
          <SectionEmptyState
            eyebrow={isFavoritesList ? favoritesEyebrow : collectionsEyebrow}
            title={
              isFavoritesList
                ? emptyStateNoResultsTitle || noMatchingFavoritesTitle
                : emptyStateNoResultsTitle || emptyResultsTitle
            }
            description={
              isFavoritesList
                ? emptyStateNoResultsDescription || noMatchingFavoritesDescription
                : emptyStateNoResultsDescription || emptyResultsDescription
            }
            tone="surface"
          />
        </div>
      )}

      <PropertyListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={showSkeleton}
      />

      {mapEnabled && (
        <PropertyMapModal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          listingPreset={listingPreset}
          appliedFilters={appliedFilters}
          favoriteIds={isFavoritesList ? favoriteIds : undefined}
          onDrawApply={handleMapDrawApply}
        />
      )}
    </div>
  )
}
