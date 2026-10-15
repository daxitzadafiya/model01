'use client'

import { CalendarDays, Heart, Printer } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useDocumentDownload } from '@/components/DocumentDownload/DocumentDownloadProvider'
import { PropertyDetailShareMenu } from '@/components/PropertyDetail/PropertyDetailShareMenu'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'
import { useTranslation } from '@/utilities/translateClient'

type FavoriteButtonProps = {
  propertyId?: FavoritePropertyId | null
  /** Projects use a separate favorites cookie. */
  kind?: 'property' | 'project'
  className?: string
  size?: 'default' | 'compact' | 'responsive'
}

export const PropertyDetailFavoriteButton: React.FC<FavoriteButtonProps> = ({
  propertyId,
  kind = 'property',
  className = '',
  size = 'default',
}) => {
  const {
    isFavorite: isPropertyFavorite,
    toggleFavorite: togglePropertyFavorite,
    isProjectFavorite,
    toggleProjectFavorite,
  } = usePropertyFavorites()
  const isFavorite = kind === 'project' ? isProjectFavorite : isPropertyFavorite
  const toggleFavorite = kind === 'project' ? toggleProjectFavorite : togglePropertyFavorite
  const favorited = propertyId != null && propertyId !== '' && isFavorite(propertyId)
  const addToFavoritesLabel = useTranslation(
    'propertyList.card.addToFavorites',
    'Add to favorites',
  )
  const removeFromFavoritesLabel = useTranslation(
    'propertyList.card.removeFromFavorites',
    'Remove from favorites',
  )

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
      aria-label={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
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

export const HOLIDAY_BOOKING_SECTION_ID = 'property-holiday-booking'

type FooterActionsProps = {
  brochureUrl?: string
  /** Holiday rentals only — scrolls to the booking calendar. */
  showBookStay?: boolean
}

export const PropertyDetailFooterActions: React.FC<FooterActionsProps> = ({
  brochureUrl,
  showBookStay = false,
}) => {
  const { requestDownload } = useDocumentDownload()
  const printPdfLabel = useTranslation('propertyDetail.actions.printPdf', 'Print PDF')
  const requestViewingLabel = useTranslation(
    'propertyDetail.actions.requestViewing',
    'Request Viewing',
  )
  const bookYourStayLabel = useTranslation(
    'propertyDetail.actions.bookYourStay',
    'Book your stay',
  )

  const scrollToBooking = () => {
    document.getElementById(HOLIDAY_BOOKING_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const primaryCtaClassName =
    'flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tertiary px-6 font-label-nav text-label-nav uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-primary hover:text-on-primary'

  const outlineCtaClassName =
    'flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/80 bg-surface-bright px-5 font-label-nav text-label-nav uppercase tracking-[0.12em] text-primary transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-on-primary'

  const utilityCtaClassName = showBookStay
    ? outlineCtaClassName
    : 'flex flex-1 cursor-pointer items-center justify-center border border-primary text-primary py-4 rounded-full text-label-nav font-label-nav uppercase text-center hover:bg-primary hover:text-on-primary transition-all duration-300'

  return (
    <div className={showBookStay ? 'mt-8 flex flex-col gap-2.5 border-t border-outline-variant/50 pt-8' : 'pt-12 flex items-center gap-4'}>
      {showBookStay ? (
        <button type="button" className={primaryCtaClassName} onClick={scrollToBooking}>
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
          <span>{bookYourStayLabel}</span>
        </button>
      ) : null}
      <div className={showBookStay ? 'flex items-stretch gap-2.5' : 'contents'}>
        {brochureUrl ? (
          <button
            type="button"
            className={utilityCtaClassName}
            onClick={() =>
              requestDownload({
                url: brochureUrl,
                actionLabel: printPdfLabel,
                documentLabel: printPdfLabel,
                kind: 'pdf',
              })
            }
          >
            <Printer size={18} strokeWidth={1.75} className={showBookStay ? undefined : 'mr-2'} aria-hidden />
            <span>{printPdfLabel}</span>
          </button>
        ) : (
          <Link href="#property-inquiry" className={utilityCtaClassName}>
            {requestViewingLabel}
          </Link>
        )}
        <PropertyDetailShareMenu variant={showBookStay ? 'inline' : 'default'} />
      </div>
    </div>
  )
}
