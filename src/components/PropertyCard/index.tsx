'use client'

import React from 'react'
import { ArrowRight, Bath, Bed, Heart, Ruler } from 'lucide-react'
import type { Media as PayloadMedia } from '@/payload-types'

import { Media } from '@/components/Media'
import { PropertyImagePlaceholder } from '@/components/PropertyImagePlaceholder'

export type PropertyCardData = {
  imageResource?: PayloadMedia
  imageUrl?: string
  location: string
  reference?: string
  title: string
  beds?: number
  baths?: number
  sqft?: number | string
  price: string
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
}

type Props = {
  property: PropertyCardData
  /**
   * Same logic as Properties block carousel:
   * - CRM: pass `property.statusBadgeLabel` (SOLD / RESERVED from API status)
   * - Sold page / CMS override: pass `'SOLD'` via `forceSoldBadge` or `showSoldBadge`
   */
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  variant?: 'surface' | 'surface-container-low'
  className?: string
  style?: React.CSSProperties
}

/** Matches Properties block: `showSoldBadge` on CMS or `forceSoldBadge` on list sold page. */
export function resolvePropertyCardStatusBadge({
  statusBadgeLabel,
  forceSoldBadge,
  showSoldBadge,
  useCrmStatus = true,
}: {
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  forceSoldBadge?: boolean
  showSoldBadge?: boolean
  /** When false (CMS manual cards), only `showSoldBadge` applies. */
  useCrmStatus?: boolean
}): 'SOLD' | 'RESERVED' | undefined {
  if (forceSoldBadge || showSoldBadge) return 'SOLD'
  if (useCrmStatus) return statusBadgeLabel
  return undefined
}

export const PropertyCard: React.FC<Props> = ({
  property,
  statusBadgeLabel,
  variant = 'surface',
  className = '',
  style,
}) => {
  const cardBase =
    variant === 'surface-container-low'
      ? 'bg-surface rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-500'
      : ''

  const imageWrapperClass =
    variant === 'surface-container-low'
      ? 'relative overflow-hidden h-[240px] md:h-[300px]'
      : 'relative overflow-hidden rounded-xl h-[280px] md:h-[400px]'

  const cardInfoClass = variant === 'surface-container-low' ? 'p-4 md:p-6' : 'mt-4 md:mt-2'

  return (
    <article className={`group cursor-pointer ${cardBase} ${className}`.trim()} style={style}>
      <div className={imageWrapperClass}>
        {property.imageResource && (
          <Media
            resource={property.imageResource}
            fill
            imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        {!property.imageResource && property.imageUrl && (
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        {!property.imageResource && !property.imageUrl && (
          <PropertyImagePlaceholder className="group-hover:scale-[1.02] transition-transform duration-700" />
        )}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/55 transition-colors"
        >
          <Heart size={20} />
        </button>
        {statusBadgeLabel && (
          <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-md px-4 py-1 text-white font-label-sm text-label-sm tracking-widest">
            {statusBadgeLabel}
          </div>
        )}
      </div>
      <div className={cardInfoClass}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="font-label-sm text-label-sm text-tertiary uppercase truncate">
            {property.location}
          </p>
          {property.reference && (
            <span className="font-label-sm text-label-sm text-secondary uppercase whitespace-nowrap">
              Ref: {property.reference}
            </span>
          )}
        </div>
        <h3 className="font-headline-sm text-headline-sm text-primary mb-1 truncate">
          {property.title}
        </h3>
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-4 text-secondary font-label-sm text-label-sm">
            <span className="flex items-center gap-1">
              <Bed size={16} />
              {property.beds ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Bath size={16} />
              {property.baths ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Ruler size={16} />
              {property.sqft
                ? typeof property.sqft === 'number'
                  ? `${property.sqft}m²`
                  : String(property.sqft)
                : 0}
            </span>
          </div>
          <span className="font-body-md text-body-md font-bold text-primary">{property.price}</span>
        </div>
        <button
          type="button"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface py-3 font-label-nav text-label-nav text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          View Property
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
        </button>
      </div>
    </article>
  )
}
