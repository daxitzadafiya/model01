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
import { cn } from '@/utilities/ui'

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

export type FavoritesListTab = 'properties' | 'projects'

export const FAVORITES_TAB_QUERY_KEY = 'fav'

export function parseFavoritesListTab(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): FavoritesListTab {
  const raw = searchParams.get(FAVORITES_TAB_QUERY_KEY)?.trim().toLowerCase()
  if (raw === 'projects' || raw === 'project') return 'projects'
  return 'properties'
}

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

  const { propertyFavoriteIds, projectFavoriteIds, propertyCount, projectCount } =
    usePropertyFavorites()
  const isFavoritesList = listingPreset === 'favorites'
  const favoritesTab = useMemo(
    () => (isFavoritesList ? parseFavoritesListTab(searchParams) : 'properties'),
    [isFavoritesList, searchParams],
  )
  const isFavoritesProjectsTab = isFavoritesList && favoritesTab === 'projects'
  const isFavoritesPropertiesTab = isFavoritesList && favoritesTab === 'properties'
  const activeFavoriteIds = isFavoritesProjectsTab ? projectFavoriteIds : propertyFavoriteIds
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

  const filterPreset: CRMListingPreset = isFavoritesProjectsTab
    ? 'projects'
    : isFavoritesList
      ? 'forSale'
      : listingPreset
  const filtersListingPreset: CRMListingPreset = isFavoritesProjectsTab
    ? 'projects'
    : listingPreset
  const mapEnabled = showMap === true && !isFavoritesProjectsTab
  const hasFavoriteIds = activeFavoriteIds.length > 0
  const favoriteIdsKey = JSON.stringify(activeFavoriteIds)

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
    isFavoritesList && hasFavoriteIds && !filtersAreApplied
      ? activeFavoriteIds.length
      : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize))

  const getListingHref = useCallback(
    (updates: { page?: number; sort?: string | null; fav?: FavoritesListTab | null }) => {
      const href = buildPropertyListListingHref(pathname, updates, searchParams, sortOptionsForUrl)
      if (!isFavoritesList || updates.fav === undefined) return href

      const [path, query = ''] = href.split('?')
      const params = new URLSearchParams(query)
      if (updates.fav === null) {
        params.delete(FAVORITES_TAB_QUERY_KEY)
      } else {
        params.set(FAVORITES_TAB_QUERY_KEY, updates.fav)
      }
      const qs = params.toString()
      return qs ? `${path}?${qs}` : path
    },
    [isFavoritesList, pathname, searchParams, sortOptionsForUrl],
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
    if (isFavoritesProjectsTab || listingPreset === 'projects') return []

    const listingMode = resolveListingModeFromPreset(listingPreset)
    const isHolidayList = listingPreset === 'forHoliday' || hasHolidayListingFilters(appliedFilters)
    const holidayGuestCount = resolveHolidayGuestsFilterCount(
      appliedFilters.guests,
      appliedFilters.guestsCustom,
    )

    return rawProperties.map((raw) =>
      normalizeCRMListProperty(raw, activeLocale, {
        listingMode,
        projectListing: false,
        holidayListing: isHolidayList,
        holidayPeriodFrom: appliedFilters.periodFrom,
        holidayPeriodTo: appliedFilters.periodTo,
        holidayGuests: holidayGuestCount != null ? String(holidayGuestCount) : undefined,
      }),
    )
  }, [activeLocale, appliedFilters, isFavoritesProjectsTab, listingPreset, rawProperties])

  const projects = useMemo(() => {
    if (listingPreset !== 'projects' && !isFavoritesProjectsTab) return []
    return rawProperties.map((raw) => normalizeCRMProject(raw, activeLocale))
  }, [activeLocale, isFavoritesProjectsTab, listingPreset, rawProperties])

  const detailListingContext: PropertyDetailListingContext | undefined =
    listingPresetToDetailContext(listingPreset)

  const sortByLabel = useTranslation('propertyList.filters.sortBy', 'Sort by')
  const showingLabel = useTranslation('propertyList.results.showing', 'Showing')
  const defaultResultsLabel = useTranslation(
    'propertyList.results.extraordinaryProperties',
    'extraordinary properties',
  )
  const projectsResultsLabel = useTranslation('propertyList.results.projects', 'projects')
  const favoritesPropertiesTabLabel = useTranslation(
    'favorites.tabs.properties',
    'Property Favorites',
  )
  const favoritesProjectsTabLabel = useTranslation('favorites.tabs.projects', 'Project Favorites')
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
  const noProjectFavoritesTitle = useTranslation(
    'propertyList.emptyState.noProjectFavoritesTitle',
    'No project favorites yet',
  )
  const noProjectFavoritesDescription = useTranslation(
    'propertyList.emptyState.noProjectFavoritesDescription',
    "You haven't favorited any projects yet. Browse our projects and tap the heart on any project to save it here.",
  )
  const noMatchingFavoritesTitle = useTranslation(
    'propertyList.emptyState.noMatchingFavoritesTitle',
    'No matching favorites',
  )
  const noMatchingFavoritesDescription = useTranslation(
    'propertyList.emptyState.noMatchingFavoritesDescription',
    'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.',
  )
  const noMatchingProjectFavoritesDescription = useTranslation(
    'propertyList.emptyState.noMatchingProjectFavoritesDescription',
    'None of your saved projects match these filters. Try adjusting your search or add more favorites from our projects.',
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
  const isProjectsList = listingPreset === 'projects' || isFavoritesProjectsTab
  const emptyResultsTitle = isProjectsList ? noProjectsTitle : noPropertiesTitle
  const emptyResultsDescription = isProjectsList ? noProjectsDescription : noPropertiesDescription
  const resolvedResultsLabel = isFavoritesProjectsTab
    ? projectsResultsLabel
    : resultsLabel || defaultResultsLabel
  const emptyFavoritesTitle = isFavoritesProjectsTab
    ? noProjectFavoritesTitle
    : emptyStateNoFavoritesTitle || noFavoritesTitle
  const emptyFavoritesDescription = isFavoritesProjectsTab
    ? noProjectFavoritesDescription
    : emptyStateNoFavoritesDescription || noFavoritesDescription
  const emptyMatchingFavoritesDescription = isFavoritesProjectsTab
    ? noMatchingProjectFavoritesDescription
    : emptyStateNoResultsDescription || noMatchingFavoritesDescription

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

    if (isFavoritesList && activeFavoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const sortTriggersClientFetch =
      sort !== defaultListSort ||
      filtersAreApplied ||
      hasMapAreaReferences(appliedFilters) ||
      (isFavoritesList && activeFavoriteIds.length > 0)

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
        if (listingPreset === 'projects' || isFavoritesProjectsTab) {
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
            projectIds: isFavoritesProjectsTab
              ? activeFavoriteIds.map(String)
              : hasMapAreaReferences(appliedFilters)
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
            favoriteIds: isFavoritesPropertiesTab ? activeFavoriteIds : undefined,
          })
          const listingBody = buildCRMListingQuery({
            preset: listingPreset,
            page,
            pageSize,
            filters: appliedFilters,
            restrictToFavoriteIds: isFavoritesPropertiesTab ? activeFavoriteIds : undefined,
            sortParams: stableSortParams,
          })
          const postReason = isFavoritesPropertiesTab
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
    activeFavoriteIds,
    activeLocale,
    appliedFilters,
    favoriteIdsKey,
    filtersHydrated,
    isFavoritesList,
    isFavoritesProjectsTab,
    isFavoritesPropertiesTab,
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

    if (activeFavoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const lastValidPage = Math.max(1, Math.ceil(activeFavoriteIds.length / pageSize))
    if (page > lastValidPage) {
      pageAdjustedByFavoritesSyncRef.current = true
      setPage(lastValidPage)
    }
  }, [activeFavoriteIds.length, favoriteIdsKey, isFavoritesList, isServerManaged, page, pageSize])

  /** Favorites: reset page/filters when switching Property / Project tabs. */
  const favoritesTabRef = useRef(favoritesTab)
  useEffect(() => {
    if (!isFavoritesList) return
    if (favoritesTabRef.current === favoritesTab) return
    favoritesTabRef.current = favoritesTab
    setFilters(EMPTY_PROPERTY_FILTERS)
    setAppliedFilters(EMPTY_PROPERTY_FILTERS)
    setPendingFiltersApplied(false)
    setPage(1)
    setRawProperties([])
    setTotal(0)
    setLoading(true)
  }, [favoritesTab, isFavoritesList])

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
    return (
      <>
        {showingLabel}{' '}
        <span className="font-bold text-on-surface">{showSkeleton ? '…' : displayTotal}</span>{' '}
        {resolvedResultsLabel}
      </>
    )
  }, [displayTotal, showSkeleton, resolvedResultsLabel, showingLabel])

  const handleFavoritesTabChange = (nextTab: FavoritesListTab) => {
    if (nextTab === favoritesTab) return
    startTransition(() => {
      router.replace(getListingHref({ page: 1, fav: nextTab }), { scroll: false })
    })
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
      {isFavoritesList && (
        <div
          role="tablist"
          aria-label="Favorites"
          className="mb-8 flex flex-wrap gap-6 border-b border-outline-variant/40"
        >
          {(
            [
              {
                id: 'properties' as const,
                label: favoritesPropertiesTabLabel,
                count: propertyCount,
              },
              {
                id: 'projects' as const,
                label: favoritesProjectsTabLabel,
                count: projectCount,
              },
            ] as const
          ).map((tab) => {
            const selected = favoritesTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${tab.label} (${tab.count})`}
                id={`favorites-tab-${tab.id}`}
                onClick={() => handleFavoritesTabChange(tab.id)}
                className={cn(
                  'relative -mb-px pb-3 font-body-md text-body-md transition-colors',
                  selected
                    ? 'text-primary border-b-2 border-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent',
                )}
              >
                {tab.label}
                <span className="ml-1.5 tabular-nums">({tab.count})</span>
              </button>
            )
          })}
        </div>
      )}

      {showFilters !== false && (
        <FiltersBar
          listingPreset={filtersListingPreset}
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
            title={emptyFavoritesTitle}
            description={emptyFavoritesDescription}
            tone="surface"
          />
        </div>
      ) : showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {Array.from({ length: pageSize }).map((_, i) => (
            <PropertyCardSkeleton key={i} animationDelay={(i % 3) * 0.12} />
          ))}
        </div>
      ) : isProjectsList && projects.length > 0 ? (
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
                ? emptyMatchingFavoritesDescription
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
          favoriteIds={isFavoritesPropertiesTab ? activeFavoriteIds : undefined}
          onDrawApply={handleMapDrawApply}
        />
      )}
    </div>
  )
}
