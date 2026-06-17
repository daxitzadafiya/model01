'use client'

import React, { useMemo } from 'react'

import { OfficeLocationsMap } from '@/components/OfficeLocationsMap/OfficeLocationsMap'
import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import type { Page } from '@/payload-types'
import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = Extract<Page['layout'][0], { blockType: 'mapBlock' }> & {
  officeLocations?: ContactOfficeLocation[]
}

const DEFAULT_CENTER = { lat: 48.9903224, lng: 12.1991392 }

function resolveMapCenter(center?: Props['center']) {
  return {
    lat:
      typeof center?.lat === 'number' && Number.isFinite(center.lat) ? center.lat : DEFAULT_CENTER.lat,
    lng:
      typeof center?.lng === 'number' && Number.isFinite(center.lng) ? center.lng : DEFAULT_CENTER.lng,
  }
}

export const MapBlock: React.FC<Props> = ({
  center,
  defaultZoom,
  height,
  title,
  officeLocations = [],
}) => {
  const deferredLocale = useDeferredSiteLocale()
  const { settings: integrations } = useIntegrationsSettings()
  const defaultTitle = useTranslation('mapBlock.title', 'Map')
  const mapTitle = useMemo(() => title || defaultTitle, [title, defaultTitle])
  const mapCenter = useMemo(() => resolveMapCenter(center), [center])
  const zoom =
    typeof defaultZoom === 'number' && Number.isFinite(defaultZoom) ? defaultZoom : 6

  if (!deferredLocale || !integrations.googleMapsApiKey) return null

  return (
    <section>
      <OfficeLocationsMap
        key={deferredLocale}
        center={mapCenter}
        defaultZoom={zoom}
        height={height}
        locations={officeLocations}
        title={mapTitle}
      />
    </section>
  )
}
