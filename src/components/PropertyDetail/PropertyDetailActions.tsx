'use client'

import { Heart, Printer } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { PropertyDetailShareMenu } from '@/components/PropertyDetail/PropertyDetailShareMenu'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'

type FavoriteButtonProps = {
  propertyId?: FavoritePropertyId | null
  className?: string
  size?: 'default' | 'compact' | 'responsive'
}

export const PropertyDetailFavoriteButton: React.FC<FavoriteButtonProps> = ({
  propertyId,
  className = '',
  size = 'default',
}) => {
  const { isFavorite, toggleFavorite } = usePropertyFavorites()
  const favorited = propertyId != null && propertyId !== '' && isFavorite(propertyId)

  if (propertyId == null || propertyId === '') return null

  const buttonSizeClass =
    size === 'compact'
      ? 'w-10 h-10'
      : size === 'responsive'
        ? 'w-10 h-10 md:w-12 md:h-12'
        : 'w-12 h-12'

  const heartSizeClass =
    size === 'compact'
      ? 'w-[18px] h-[18px]'
      : size === 'responsive'
        ? 'w-[18px] h-[18px] md:w-[22px] md:h-[22px]'
        : 'w-[22px] h-[22px]'

  return (
    <button
      type="button"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
      onClick={() => toggleFavorite(propertyId)}
      className={`${buttonSizeClass} rounded-full border border-outline-variant flex items-center justify-center text-primary hover:border-tertiary hover:text-tertiary transition-all cursor-pointer shrink-0 ${className}`.trim()}
    >
      <Heart
        className={`${heartSizeClass} ${favorited ? 'fill-tertiary text-tertiary' : 'fill-none'}`}
        strokeWidth={1.75}
      />
    </button>
  )
}

type FooterActionsProps = {
  brochureUrl?: string
}

export const PropertyDetailFooterActions: React.FC<FooterActionsProps> = ({ brochureUrl }) => {
  return (
    <div className="pt-12 flex items-center gap-4">
      {brochureUrl ? (
        <a
          href={brochureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 border border-primary text-primary py-4 rounded-full text-label-nav font-label-nav uppercase text-center hover:bg-primary hover:text-on-primary transition-all duration-300"
        >
          <div className="flex items-center justify-center">
            {/* add icon */}
            <Printer size={20} className="mr-2" />
            <span>Print PDF</span>
          </div>
        </a>
      ) : (
        <Link
          href="#property-inquiry"
          className="flex-1 border border-primary text-primary py-4 rounded-full text-label-nav font-label-nav uppercase text-center hover:bg-primary hover:text-on-primary transition-all duration-300"
        >
          Request Viewing
        </Link>
      )}
      <PropertyDetailShareMenu />
    </div>
  )
}
