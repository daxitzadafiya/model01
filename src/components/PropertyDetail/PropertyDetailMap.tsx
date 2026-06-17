'use client'
import React from 'react'
import { LocalizedGoogleMapIframe } from '@/components/LocalizedGoogleMapIframe/LocalizedGoogleMapIframe'
import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'
import { toGoogleHl } from '@/utilities/googleLocale'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = {
  latitude: number
  longitude: number
  title: string
  locationLabel: string
  description?: string
}

export const PropertyDetailMap: React.FC<Props> = ({
  latitude,
  longitude,
  title,
  locationLabel,
  description,
}) => {
  const deferredLocale = useDeferredSiteLocale()
  const heading = useTranslation('propertyDetail.map.heading', 'Prime Location')
  const openInMapsLabel = useTranslation('propertyDetail.map.openInMaps', 'Open in Maps')
  const mapTitlePrefix = useTranslation('propertyDetail.map.mapTitlePrefix', 'Map for')
  const googleHl = deferredLocale ? toGoogleHl(deferredLocale) : 'en'
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=${googleHl}`
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed&hl=${googleHl}&language=${googleHl}`

  return (
    <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-24">
      <h2 className="text-headline-lg font-headline-lg text-primary mb-12">{heading}</h2>
      <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-lg group">
        {deferredLocale ? (
          <LocalizedGoogleMapIframe
            key={deferredLocale}
            className="w-full h-full border-0"
            height={500}
            locale={deferredLocale}
            mapUrl={embedUrl}
            title={`${mapTitlePrefix} ${title}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-low" />
        )}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-lg max-w-xs shadow-xl">
          <h4 className="font-headline-sm text-primary mb-2">{title}</h4>
          <p className="text-label-sm font-label-sm text-on-surface-variant mb-3 uppercase">
            {locationLabel}
          </p>
          {description && (
            <p className="text-body-md font-body-md text-on-surface-variant">{description}</p>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-4 text-label-sm font-label-sm text-accent-gold uppercase hover:underline"
          >
            {openInMapsLabel}
            <PropertyDetailIcon name="open_in_new" className="text-accent-gold" size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
