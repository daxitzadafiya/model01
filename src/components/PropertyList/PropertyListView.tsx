'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useSiteLocale } from '@/utilities/useSiteLocale'

import { FilterSelect } from '@/components/FilterSelect'
import { PropertyMapModal } from '@/components/PropertyMap/PropertyMapModal'
import { ArrowUpDown } from 'lucide-react'
import { useCRMCoasts } from '@/hooks/useCRMCoasts'
import { useCRMCities } from '@/hooks/useCRMCities'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { PropertyCardSkeleton } from '@/components/PropertyCard/PropertyCardSkeleton'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import {
  buildCRMListingQuery,
  fetchCRMProperties,
  normalizeCRMListProperty,
  resolveListingModeFromPreset,
  type CRMListingPreset,
  type PropertyListFilters,
} from '@/utilities/crmProperties'
import { EMPTY_PROPERTY_FILTERS, hasAppliedPropertyFilters } from './filterOptions'
import { useSortOptions } from './useFilterOptionLabels'
import { PropertyListFilters as FiltersBar } from './PropertyListFilters'
import { PropertyListPagination } from './PropertyListPagination'
import {
  clearPendingPropertyListFilters,
  normalizePropertyListFilters,
  stripPropertyFilterSearchParams,
  takePendingPropertyListFilters,
} from './propertyFilterUrl'
import { buildPropertyListListingHref } from './propertyListUrl'
import { useTranslation } from '@/utilities/translateClient'

export type PropertyListInitialData = {
  page: number
  properties: Record<string, unknown>[]
  total: number
  sort: string
  preloadImageUrls?: string[]
}

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
}

const DEFAULT_PAGE_SIZE = 9

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
}) => {
  const pageSize = Math.max(1, pageSizeProp ?? DEFAULT_PAGE_SIZE)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeLocale = useSiteLocale()
  const sortOptions = useSortOptions()

  const [pendingFiltersApplied, setPendingFiltersApplied] = useState(false)
  const [filtersHydrated, setFiltersHydrated] = useState(false)
  const [filters, setFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [mapModalOpen, setMapModalOpen] = useState(false)

  const { favoriteIds } = usePropertyFavorites()
  const isFavoritesList = listingPreset === 'favorites'
  const filtersAreApplied = hasAppliedPropertyFilters(appliedFilters)
  const isServerManaged =
    !isFavoritesList && !filtersAreApplied && !pendingFiltersApplied && Boolean(initialData)

  const [page, setPage] = useState(initialData?.page ?? 1)
  const [sort, setSort] = useState(initialData?.sort ?? '')
  const [rawProperties, setRawProperties] = useState<Record<string, unknown>[]>(
    initialData?.properties ?? [],
  )
  const [total, setTotal] = useState(initialData?.total ?? 0)
  const [loading, setLoading] = useState(!isServerManaged && !initialData)

  const filterPreset = isFavoritesList ? 'forSale' : listingPreset
  const mapEnabled = showMap === true
  const hasFavoriteIds = favoriteIds.length > 0
  const favoriteIdsKey = JSON.stringify(favoriteIds)

  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterPreset)
  const { coasts, loading: coastsLoading } = useCRMCoasts()
  const { cities, loading: citiesLoading } = useCRMCities(filters.coast, coasts, filterPreset)

  const favoritesSyncReadyRef = useRef(false)
  const pageAdjustedByFavoritesSyncRef = useRef(false)
  const fetchGenerationRef = useRef(0)

  const displayTotal =
    isFavoritesList && hasFavoriteIds && !filtersAreApplied ? favoriteIds.length : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize))

  const getListingHref = useCallback(
    (updates: { page?: number; sort?: string | null }) =>
      buildPropertyListListingHref(pathname, updates, searchParams),
    [pathname, searchParams],
  )

  const properties = useMemo(() => {
    const listingMode = resolveListingModeFromPreset(listingPreset)
    return rawProperties.map((raw) =>
      normalizeCRMListProperty(raw, activeLocale, { listingMode }),
    )
  }, [activeLocale, listingPreset, rawProperties])

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

  /** Apply server-rendered listing (page, sort, properties). */
  useEffect(() => {
    if (!initialData || !isServerManaged) return

    setPage(initialData.page)
    setSort(initialData.sort)
    setRawProperties(initialData.properties)
    setTotal(initialData.total)
    setLoading(false)
  }, [initialData, isServerManaged])

  useEffect(() => {
    if (!sortOptions.length || isServerManaged) return
    setSort((current) =>
      sortOptions.some((option) => option.value === current) ? current : sortOptions[0].value,
    )
  }, [isServerManaged, sortOptions])

  /** Hero search → listing: sessionStorage filters (client fetch only). */
  useEffect(() => {
    const pending = takePendingPropertyListFilters()
    if (pending) {
      setPendingFiltersApplied(true)
      setFilters(pending)
      setAppliedFilters(pending)
      setPage(1)
      setLoading(true)
      router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
    }
    stripPropertyFilterSearchParams()
    setFiltersHydrated(true)
  }, [getListingHref, router])

  /** Client CRM fetch — favorites and filtered listings only. */
  useEffect(() => {
    if (!filtersHydrated || isServerManaged) return

    if (isFavoritesList && favoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    if (!sort) return

    const sortParams = sortOptions.find((option) => option.value === sort)?.sort
    const controller = new AbortController()
    const generation = ++fetchGenerationRef.current

    const load = async () => {
      const showSkeleton = !(isFavoritesList && pageAdjustedByFavoritesSyncRef.current)
      pageAdjustedByFavoritesSyncRef.current = false
      if (showSkeleton) setLoading(true)

      try {
        const body = buildCRMListingQuery({
          preset: listingPreset,
          page,
          pageSize,
          filters: appliedFilters,
          restrictToFavoriteIds: isFavoritesList ? favoriteIds : undefined,
          sortParams,
        })

        const result = await fetchCRMProperties({ body, signal: controller.signal })
        if (controller.signal.aborted || generation !== fetchGenerationRef.current) return

        setRawProperties(result.properties as Record<string, unknown>[])
        setTotal(result.total)
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
    appliedFilters,
    favoriteIds,
    filtersHydrated,
    isFavoritesList,
    isServerManaged,
    listingPreset,
    page,
    pageSize,
    sort,
    sortOptions,
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
    setFilters(normalized)
    setAppliedFilters(normalized)
    setPage(1)
    setLoading(true)
    router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
  }

  const handleSortChange = (nextSort: string) => {
    if (isServerManaged) {
      router.push(getListingHref({ page: 1, sort: nextSort }))
      return
    }
    setSort(nextSort)
    setPage(1)
    setLoading(true)
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return
    setPage(nextPage)
    setLoading(true)
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
    router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
  }

  const resultsText = useMemo(() => {
    const label = resultsLabel || defaultResultsLabel
    return (
      <>
        {showingLabel}{' '}
        <span className="font-bold text-on-surface">{loading ? '…' : displayTotal}</span> {label}
      </>
    )
  }, [displayTotal, loading, resultsLabel, showingLabel, defaultResultsLabel])

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
      {showFilters !== false && (
        <FiltersBar
          filters={filters}
          appliedFilters={appliedFilters}
          onChange={handleFilterChange}
          onApply={handleApply}
          showMap={mapEnabled}
          onOpenMap={() => setMapModalOpen(true)}
          propertyTypeOptions={propertyTypeOptions}
          propertyTypeLoading={propertyTypeLoading}
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
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {Array.from({ length: pageSize }).map((_, i) => (
            <PropertyCardSkeleton key={i} animationDelay={(i % 3) * 0.12} />
          ))}
        </div>
      ) : properties.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {properties.map((property) => (
            <PropertyCard
              key={property.id ?? property.reference ?? property.title}
              propertyId={property.id}
              href={property.detailHref}
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
                statusBadgeLabel: property.statusBadgeLabel,
              }}
              statusBadgeLabel={resolvePropertyCardStatusBadge({
                statusBadgeLabel: property.statusBadgeLabel,
                forceSoldBadge: Boolean(forceSoldBadge),
                useCrmStatus: true,
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
                : noPropertiesTitle
            }
            description={
              isFavoritesList
                ? emptyStateNoResultsDescription || noMatchingFavoritesDescription
                : noPropertiesDescription
            }
            tone="surface"
          />
        </div>
      )}

      <PropertyListPagination
        page={page}
        totalPages={totalPages}
        getPageHref={
          isServerManaged ? (targetPage) => getListingHref({ page: targetPage }) : undefined
        }
        onPageChange={isServerManaged ? undefined : handlePageChange}
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
