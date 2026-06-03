'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useSiteLocale } from '@/utilities/useSiteLocale'

import { FilterSelect } from '@/components/FilterSelect'
import { ArrowUpDown } from 'lucide-react'
import { useCRMLocationTree } from '@/hooks/useCRMLocationTree'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import {
  buildCRMListingQuery,
  fetchCRMProperties,
  normalizeCRMListProperty,
  sortProperties,
  type CRMListingPreset,
  type PropertyListFilters,
  type PropertyListSort,
} from '@/utilities/crmProperties'
import { EMPTY_PROPERTY_FILTERS, SORT_OPTIONS } from './filterOptions'
import { PropertyListFilters as FiltersBar } from './PropertyListFilters'
import { PropertyListPagination } from './PropertyListPagination'

type Props = {
  listingPreset: CRMListingPreset
  crmQueryJson?: string | null
  pageSize?: number | null
  showFilters?: boolean | null
  mapSearchUrl?: string | null
  forceSoldBadge?: boolean | null
  resultsLabel?: string | null
}

const DEFAULT_PAGE_SIZE = 9

export const PropertyListView: React.FC<Props> = ({
  listingPreset,
  crmQueryJson,
  pageSize: pageSizeProp,
  showFilters = true,
  mapSearchUrl,
  forceSoldBadge,
  resultsLabel,
}) => {
  const pageSize = Math.max(1, pageSizeProp ?? DEFAULT_PAGE_SIZE)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<PropertyListSort>('newest')
  const [filters, setFilters] = useState<PropertyListFilters>({ ...EMPTY_PROPERTY_FILTERS })
  const [appliedFilters, setAppliedFilters] = useState<PropertyListFilters>({
    ...EMPTY_PROPERTY_FILTERS,
  })
  const [rawProperties, setRawProperties] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const activeLocale = useSiteLocale()
  const {
    options: propertyTypeOptions,
    loading: propertyTypeLoading,
  } = useCRMPropertyTypeOptions(listingPreset)
  const { tree: locationTree, loading: locationLoading } = useCRMLocationTree(listingPreset)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const properties = useMemo(() => {
    const normalized = rawProperties.map((raw) =>
      normalizeCRMListProperty(raw, activeLocale),
    )
    return sortProperties(normalized, sort)
  }, [activeLocale, rawProperties, sort])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const body = buildCRMListingQuery({
          preset: listingPreset,
          crmQueryJson,
          page,
          pageSize,
          filters: appliedFilters,
        })

        const result = await fetchCRMProperties({ body, signal: controller.signal })
        setRawProperties(result.properties as Record<string, unknown>[])
        setTotal(result.total)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load property list', error)
          setRawProperties([])
          setTotal(0)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [appliedFilters, crmQueryJson, listingPreset, page, pageSize])

  const handleFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

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
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resultsText = useMemo(() => {
    const label = resultsLabel || 'extraordinary properties'
    return (
      <>
        Showing <span className="font-bold text-on-surface">{loading ? '…' : total}</span> {label}
      </>
    )
  }, [loading, resultsLabel, total])

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
      {showFilters !== false && (
        <FiltersBar
          filters={filters}
          onChange={handleFilterChange}
          onApply={handleApply}
          mapSearchUrl={mapSearchUrl}
          propertyTypeOptions={propertyTypeOptions}
          propertyTypeLoading={propertyTypeLoading}
          locationTree={locationTree}
          locationLoading={locationLoading}
        />
      )}

      <section className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
        <div className="font-body-lg text-body-lg text-on-surface-variant">{resultsText}</div>
        <FilterSelect
          label="Sort by"
          id="property-list-sort"
          icon={<ArrowUpDown size={20} strokeWidth={1.75} />}
          options={SORT_OPTIONS}
          value={sort}
          onChange={(value) => handleSortChange(value as PropertyListSort)}
          className="w-full md:w-auto md:min-w-[220px]"
        />
      </section>

      {loading ? (
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
              property={{
                imageUrl: property.imageUrl,
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
            eyebrow="Collections"
            title="No properties found"
            description="We could not find any listings for this selection. Try adjusting your filters or check again soon."
            tone="surface"
          />
        </div>
      )}

      <PropertyListPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  )
}
