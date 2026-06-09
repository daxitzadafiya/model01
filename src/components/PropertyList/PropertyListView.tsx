'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSiteLocale } from '@/utilities/useSiteLocale'

import { FilterSelect } from '@/components/FilterSelect'
import { PropertyMapModal } from '@/components/PropertyMap/PropertyMapModal'
import { ArrowUpDown } from 'lucide-react'
import { useCRMLocationTree } from '@/hooks/useCRMLocationTree'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import {
  buildCRMListingQuery,
  fetchCRMProperties,
  normalizeCRMListProperty,
  sortProperties,
  type CRMListingPreset,
  type PropertyListFilters,
  type PropertyListSort,
} from '@/utilities/crmProperties'
import { EMPTY_PROPERTY_FILTERS, hasAppliedPropertyFilters } from './filterOptions'
import { useSortOptions } from './useFilterOptionLabels'
import { PropertyListFilters as FiltersBar } from './PropertyListFilters'
import { PropertyListPagination } from './PropertyListPagination'
import {
  consumePendingPropertyListFilters,
  stripPropertyFilterSearchParams,
} from './propertyFilterUrl'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  listingPreset: CRMListingPreset
  crmQueryJson?: string | null
  pageSize?: number | null
  showFilters?: boolean | null
  showMap?: boolean | null
  forceSoldBadge?: boolean | null
  resultsLabel?: string | null
  emptyStateNoFavoritesTitle?: string | null
  emptyStateNoFavoritesDescription?: string | null
  emptyStateNoResultsTitle?: string | null
  emptyStateNoResultsDescription?: string | null
}

const DEFAULT_PAGE_SIZE = 9

export const PropertyListView: React.FC<Props> = ({
  listingPreset,
  crmQueryJson,
  pageSize: pageSizeProp,
  showFilters = true,
  showMap = false,
  forceSoldBadge,
  resultsLabel,
  emptyStateNoFavoritesTitle,
  emptyStateNoFavoritesDescription,
  emptyStateNoResultsTitle,
  emptyStateNoResultsDescription,
}) => {
  const pageSize = Math.max(1, pageSizeProp ?? DEFAULT_PAGE_SIZE)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<PropertyListSort>('newest')
  const [filters, setFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [appliedFilters, setAppliedFilters] =
    useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [rawProperties, setRawProperties] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const activeLocale = useSiteLocale()
  const mapEnabled = showMap === true
  const pendingPageScrollRef = useRef(false)

  const scrollToPageTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  // const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const { favoriteIds } = usePropertyFavorites()
  const isFavoritesList = listingPreset === 'favorites'
  const filterPreset = isFavoritesList ? 'forSale' : listingPreset
  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterPreset)
  const { tree: locationTree, loading: locationLoading } = useCRMLocationTree(filterPreset)
  const hasFavoriteIds = favoriteIds.length > 0
  const favoriteIdsKey = JSON.stringify(favoriteIds)
  const favoritesSyncReadyRef = useRef(false)
  const pageAdjustedByFavoritesSyncRef = useRef(false)
  const fetchGenerationRef = useRef(0)

  const filtersAreApplied = hasAppliedPropertyFilters(appliedFilters)
  const displayTotal =
    isFavoritesList && hasFavoriteIds && !filtersAreApplied ? favoriteIds.length : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize))
  const sortByLabel = useTranslation('propertyList.filters.sortBy', 'Sort by')
  const sortOptions = useSortOptions()
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
  const properties = useMemo(() => {
    const normalized = rawProperties.map((raw) =>
      normalizeCRMListProperty(raw, activeLocale, { listingMode: 'sale' }),
    )
    return sortProperties(normalized, sort)
  }, [activeLocale, rawProperties, sort])

  /** CRM fetch for filters/pagination — not when toggling hearts on for-sale. */
  useEffect(() => {
    if (isFavoritesList && favoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
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
        const body = buildCRMListingQuery({
          preset: listingPreset,
          crmQueryJson,
          page,
          pageSize,
          filters: appliedFilters,
          restrictToFavoriteIds: isFavoritesList ? favoriteIds : undefined,
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
    // favoriteIds intentionally omitted — toggling hearts must not refetch for-sale lists
  }, [appliedFilters, crmQueryJson, isFavoritesList, listingPreset, page, pageSize])

  /** Favorites page: after unfavoriting, move to a valid page and refetch (no full-page skeleton). */
  useEffect(() => {
    if (!isFavoritesList) {
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
    const targetPage = Math.min(page, lastValidPage)

    if (targetPage !== page) {
      pageAdjustedByFavoritesSyncRef.current = true
      setPage(targetPage)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        const body = buildCRMListingQuery({
          preset: listingPreset,
          crmQueryJson,
          page: targetPage,
          pageSize,
          filters: appliedFilters,
          restrictToFavoriteIds: favoriteIds,
        })

        const result = await fetchCRMProperties({ body, signal: controller.signal })
        if (controller.signal.aborted) return

        setRawProperties(result.properties as Record<string, unknown>[])
        setTotal(result.total)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to refresh favorites page', error)
        }
      }
    }

    void load()
    return () => controller.abort()
    // Only re-run when saved favorites change — not when filters/pagination change
  }, [favoriteIdsKey, isFavoritesList, listingPreset, pageSize])

  useEffect(() => {
    if (loading || !pendingPageScrollRef.current) return
    pendingPageScrollRef.current = false
    scrollToPageTop()
  }, [loading, page, scrollToPageTop])

  const handleFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const pending = consumePendingPropertyListFilters()
    if (pending) {
      setFilters(pending)
      setAppliedFilters(pending)
      setPage(1)
    }
    stripPropertyFilterSearchParams()
  }, [])

  const handleApply = (nextFilters: PropertyListFilters) => {
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(1)
  }

  const handleSortChange = (nextSort: PropertyListSort) => {
    setSort(nextSort)
    setPage(1)
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return
    pendingPageScrollRef.current = true
    setPage(nextPage)
    scrollToPageTop()
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
    <PropertyFilterOptionsProvider>
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
          locationTree={locationTree}
          locationLoading={locationLoading}
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
          onChange={(value) => handleSortChange(value as PropertyListSort)}
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
            <div key={i} className="space-y-4 animate-pulse">
              <div className="rounded-xl h-[280px] md:h-[400px] bg-surface-container-high" />
              <div className="h-4 w-2/3 rounded bg-surface-container-high" />
              <div className="h-6 w-full rounded bg-surface-container-high" />
            </div>
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

      <PropertyListPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />

      {mapEnabled && (
        <PropertyMapModal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          listingPreset={listingPreset}
          crmQueryJson={crmQueryJson}
          appliedFilters={appliedFilters}
          favoriteIds={isFavoritesList ? favoriteIds : undefined}
          onDrawApply={handleMapDrawApply}
        />
      )}
    </div>
    </PropertyFilterOptionsProvider>
  )
}
