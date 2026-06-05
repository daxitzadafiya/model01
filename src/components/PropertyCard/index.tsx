'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Bath, Bed, Heart, Ruler } from 'lucide-react'
import type { Media as PayloadMedia } from '@/payload-types'

import { PropertyCardImageGallery } from '@/components/PropertyCard/PropertyCardImageGallery'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'

export type PropertyCardData = {
  imageResource?: PayloadMedia
  imageUrl?: string
  /** Multiple CRM images for in-card slider */
  imageUrls?: string[]
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
  /** CRM property id — enables favorite toggle when set */
  propertyId?: FavoritePropertyId | null
  /** When set, card navigates to property detail page */
  href?: string
  /**
   * Same logic as Properties block carousel:
   * - CRM: pass `property.statusBadgeLabel` (SOLD / RESERVED from API status)
   * - Sold page / CMS override: pass `'SOLD'` via `forceSoldBadge` or `showSoldBadge`
   */
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  variant?: 'surface' | 'surface-container-low'
  className?: string
  style?: React.CSSProperties
  /** When set (e.g. Properties block), pauses parent carousel auto-play while engaging this card */
  onCardEngage?: () => void
  onCardRelease?: () => void
}

/** Display property area as a whole number (e.g. 90.6m² → 90m²). */
export function formatPropertyAreaDisplay(sqft?: number | string): string {
  if (sqft === undefined || sqft === null || sqft === '') return '0'

  const toInteger = (value: number) =>
    `${Math.floor(value).toLocaleString('en-US')}`

  if (typeof sqft === 'number') {
    if (!Number.isFinite(sqft) || sqft <= 0) return '0'
    return `${toInteger(sqft)}m²`
  }

  const raw = String(sqft).trim()
  const match = raw.match(/^([\d.,]+)\s*(m²|m2|ft²|ft2)?$/i)

  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''))
    if (!Number.isFinite(value) || value <= 0) return '0'

    const unitToken = match[2]?.toLowerCase()
    const unit = unitToken?.startsWith('ft') ? 'ft²' : 'm²'
    return `${toInteger(value)}${unit}`
  }

  return raw
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
  propertyId,
  href,
  statusBadgeLabel,
  variant = 'surface',
  className = '',
  style,
  onCardEngage,
  onCardRelease,
}) => {
  const { isFavorite, toggleFavorite } = usePropertyFavorites()
  const favorited = propertyId != null && propertyId !== '' && isFavorite(propertyId)

  const handleFavoritePointer = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleFavoritePointer(event)
    if (propertyId == null || propertyId === '') return
    toggleFavorite(propertyId)
  }

  const cardBase =
    variant === 'surface-container-low'
      ? 'bg-surface rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-500'
      : ''

  const imageWrapperClass =
    variant === 'surface-container-low'
      ? 'relative overflow-hidden h-[240px] md:h-[300px]'
      : 'relative overflow-hidden rounded-xl h-[280px] md:h-[400px]'

  const cardInfoClass = variant === 'surface-container-low' ? 'p-4 md:p-6' : 'mt-4 md:mt-2'

  const viewButton = href ? (
    <span className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface py-3 font-label-nav text-label-nav text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-md transition-all duration-300">
      View Property
      <ArrowRight
        size={16}
        className="group-hover:translate-x-1 transition-transform duration-300"
      />
    </span>
  ) : (
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
  )

  const cardBody = (
    <>
      <div className={imageWrapperClass}>
        <PropertyCardImageGallery
          title={property.title}
          imageResource={property.imageResource}
          imageUrl={property.imageUrl}
          imageUrls={property.imageUrls}
          onInteract={onCardEngage}
        />
        {propertyId != null && propertyId !== '' && (
          <button
            type="button"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorited}
            onMouseDown={handleFavoritePointer}
            onClick={handleFavoriteClick}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center cursor-pointer hover:bg-black/55 transition-colors z-10"
          >
            <Heart size={20} className={favorited ? 'fill-current text-tertiary-container' : 'fill-none'} />
          </button>
        )}
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
              {formatPropertyAreaDisplay(property.sqft)}
            </span>
          </div>
          <span className="font-body-md text-body-md font-bold text-primary">{property.price}</span>
        </div>
        {viewButton}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={`group block cursor-pointer ${cardBase} ${className}`.trim()}
        style={style}
        onMouseEnter={onCardEngage}
        onMouseLeave={onCardRelease}
      >
        {cardBody}
      </Link>
    )
  }

  return (
    <article
      className={`group cursor-pointer ${cardBase} ${className}`.trim()}
      style={style}
      onMouseEnter={onCardEngage}
      onMouseLeave={onCardRelease}
    >
      {cardBody}
    </article>
  )
}
