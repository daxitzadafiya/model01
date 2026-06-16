'use client'

import React, { useMemo } from 'react'

import { LocalizedGoogleMapIframe } from '@/components/LocalizedGoogleMapIframe/LocalizedGoogleMapIframe'
import type { Page } from '@/payload-types'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = Extract<Page['layout'][0], { blockType: 'mapBlock' }>

export const MapBlock: React.FC<Props> = ({ mapUrl, height, title }) => {
  const deferredLocale = useDeferredSiteLocale()
  const defaultTitle = useTranslation('mapBlock.title', 'Map')
  const mapTitle = useMemo(() => title || defaultTitle, [title, defaultTitle])

  if (!mapUrl || !deferredLocale) return null

  return (
    <section>
      <LocalizedGoogleMapIframe
        key={deferredLocale}
        height={height}
        locale={deferredLocale}
        mapUrl={mapUrl}
        title={mapTitle}
      />
    </section>
  )
}
