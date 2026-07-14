'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePropertyMapSettings } from '@/hooks/usePropertyMapSettings'
import { fetchCRMMapProperties, type MapPropertyPoint } from '@/utilities/crmPropertyMap'
import type { CRMListingPreset, PropertyListFilters } from '@/utilities/crmProperties'
import { filtersForMapMarkers } from '@/utilities/propertyMapFilters'
import { appendListingContextToDetailHref } from '@/components/PropertyList/propertyFilterUrl'
import { stashPropertyDetailFetchStatus } from '@/utilities/propertyDetailFetchStatus'
import {
  listingPresetToDetailContext,
  stashPropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'
import { useTranslation } from '@/utilities/translateClient'

import { PropertyMapView } from './PropertyMapView'

type Props = {
  open: boolean
  onClose: () => void
  listingPreset: CRMListingPreset
  appliedFilters: PropertyListFilters
  favoriteIds?: (string | number)[]
  onDrawApply?: (references: string[]) => void
}

export const PropertyMapModal: React.FC<Props> = ({
  open,
  onClose,
  listingPreset,
  appliedFilters,
  favoriteIds,
  onDrawApply,
}) => {
  const loadErrorFallback = useTranslation(
    'propertyMap.error.loadFailed',
    'Failed to load map properties',
  )
  const closeMapLabel = useTranslation('propertyMap.modal.close', 'Close map')
  const closeLabel = useTranslation('propertyMap.modal.closeButton', 'Close')
  const { settings, loading: settingsLoading } = usePropertyMapSettings()
  const router = useRouter()
  const [points, setPoints] = useState<MapPropertyPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapFilters = useMemo(() => filtersForMapMarkers(appliedFilters), [appliedFilters])
  const mapFiltersKey = useMemo(() => JSON.stringify(mapFilters), [mapFilters])
  const favoriteIdsKey = useMemo(
    () => (favoriteIds?.length ? JSON.stringify(favoriteIds) : ''),
    [favoriteIds],
  )
  const fetchGenerationRef = useRef(0)

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

  useEffect(() => {
    if (!open || settingsLoading) return

    const controller = new AbortController()
    const generation = ++fetchGenerationRef.current

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchCRMMapProperties({
          preset: listingPreset,
          filters: mapFilters,
          restrictToFavoriteIds: favoriteIds?.length ? favoriteIds : undefined,
          pageSize: settings.mapFetchLimit,
          signal: controller.signal,
        })

        if (controller.signal.aborted || generation !== fetchGenerationRef.current) return
        setPoints(result.properties)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (generation !== fetchGenerationRef.current) return
        console.error('Failed to load map properties', err)
        setError(err instanceof Error ? err.message : loadErrorFallback)
        setPoints([])
      } finally {
        if (!controller.signal.aborted && generation === fetchGenerationRef.current) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [open, settingsLoading, listingPreset, mapFiltersKey, favoriteIdsKey, settings.mapFetchLimit])

  const handleMarkerClick = useCallback(
    (point: MapPropertyPoint) => {
      const reference = String(point.reference)
      const listingContext = listingPresetToDetailContext(listingPreset)

      if (listingPreset === 'sold') {
        stashPropertyDetailFetchStatus(reference, ['Sold'])
      }
      if (listingContext) {
        stashPropertyDetailListingContext(reference, listingContext)
      }

      const href = appendListingContextToDetailHref(
        `/property-details/_${reference}`,
        listingContext,
      )
      router.push(href ?? `/property-details/_${reference}`)
    },
    [listingPreset, router],
  )

  const handleDrawApply = useCallback(
    (references: string[]) => {
      onDrawApply?.(references)
      onClose()
    },
    [onClose, onDrawApply],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-map-title"
    >
      <button
        type="button"
        aria-label={closeMapLabel}
        className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4 md:px-6">
          <h2 id="property-map-title" className="font-headline-sm text-headline-sm text-on-surface">
            {settings.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label={closeLabel}
          >
            <X size={22} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {error ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            </div>
          ) : (
            <PropertyMapView
              points={points}
              settings={settings}
              loading={loading || settingsLoading}
              onMarkerClick={handleMarkerClick}
              onDrawApply={handleDrawApply}
            />
          )}
        </div>
      </div>
    </div>
  )
}
