'use client'

import React, { useMemo } from 'react'

import { OfficeLocationsMap } from '@/components/OfficeLocationsMap/OfficeLocationsMap'
import type { Page } from '@/payload-types'
import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'
import { useTranslation } from '@/utilities/translateClient'

type Props = Extract<Page['layout'][0], { blockType: 'mapBlock' }> & {
  officeLocations?: ContactOfficeLocation[]
}

const DEFAULT_CENTER = { lat: 48.9903224, lng: 12.1991392 }
const DEFAULT_ZOOM = 6

function resolveMapCenter(center?: Props['center']) {
  return {
    lat:
      typeof center?.lat === 'number' && Number.isFinite(center.lat) ? center.lat : DEFAULT_CENTER.lat,
    lng:
      typeof center?.lng === 'number' && Number.isFinite(center.lng) ? center.lng : DEFAULT_CENTER.lng,
  }
}

function resolveMapZoom(value: unknown, fallback = DEFAULT_ZOOM): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(20, n)
}

export const MapBlock: React.FC<Props> = ({
  center,
  defaultZoom,
  height,
  title,
  officeLocations = [],
}) => {
  const defaultTitle = useTranslation('mapBlock.title', 'Map')
  const mapTitle = useMemo(() => title || defaultTitle, [title, defaultTitle])
  const mapCenter = useMemo(() => resolveMapCenter(center), [center])
  const zoom = resolveMapZoom(defaultZoom)

  return (
    <section>
      <OfficeLocationsMap
        center={mapCenter}
        defaultZoom={zoom}
        height={height}
        locations={officeLocations}
        title={mapTitle}
      />
    </section>
  )
}
