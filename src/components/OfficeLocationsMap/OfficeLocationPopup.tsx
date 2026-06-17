'use client'

import { Mail, MapPin, Navigation, Phone, X } from 'lucide-react'
import React from 'react'

import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'

type Props = {
  location: ContactOfficeLocation
  directionsLabel: string
  onClose?: () => void
  variant?: 'floating' | 'sheet'
}

export const OfficeLocationPopup: React.FC<Props> = ({
  location,
  directionsLabel,
  onClose,
  variant = 'floating',
}) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`
  const isSheet = variant === 'sheet'

  const closeButton = onClose ? (
    <button
      type="button"
      aria-label="Close"
      className={
        isSheet && location.imageUrl
          ? 'inline-flex size-9 items-center justify-center rounded-full bg-white/92 text-primary shadow-md backdrop-blur-sm transition-colors hover:bg-white sm:size-10'
          : 'inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container sm:size-9'
      }
      onClick={onClose}
    >
      <X size={18} strokeWidth={2} />
    </button>
  ) : null

  return (
    <article
      className={
        isSheet
          ? 'flex max-h-[min(72dvh,28rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-outline-variant/40 bg-white shadow-[0_-12px_40px_-16px_rgba(15,23,42,0.35)] sm:max-h-[min(68dvh,30rem)] sm:rounded-t-3xl'
          : 'w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur-md sm:w-[min(320px,calc(100vw-2.5rem))]'
      }
    >
      {isSheet && location.imageUrl ? (
        <div className="relative h-42 w-full shrink-0 overflow-hidden sm:h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full w-full object-cover" src={location.imageUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-black/20" />
          {closeButton ? (
            <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">{closeButton}</div>
          ) : null}
        </div>
      ) : (
        <>
          {closeButton ? (
            <div className="flex shrink-0 justify-end p-2 pb-0 sm:p-3">{closeButton}</div>
          ) : null}
          {location.imageUrl ? (
            <div
              className={`relative w-full shrink-0 overflow-hidden ${isSheet ? 'h-28 sm:h-32' : 'h-32 sm:h-36'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="h-full w-full object-cover" src={location.imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>
          ) : null}
        </>
      )}

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          isSheet ? 'space-y-3 p-4 sm:space-y-4 sm:p-5' : 'space-y-4 p-4 sm:p-5'
        }`}
      >
        <div className="space-y-1.5">
          {location.label ? (
            <p className="font-label-nav text-[11px] uppercase tracking-[0.18em] text-tertiary sm:text-xs">
              {location.label}
            </p>
          ) : null}
          <h3 className="font-headline-sm text-headline-sm text-primary sm:text-[1.35rem]">
            {location.city}
          </h3>
          {location.address ? (
            <p className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <MapPin className="mt-0.5 shrink-0 text-tertiary" size={15} strokeWidth={2} />
              <span>{location.address}</span>
            </p>
          ) : null}
        </div>

        {(location.phone || location.email) && (
          <div className="space-y-2 border-t border-outline-variant/70 pt-3">
            {location.phone ? (
              <a
                className="flex items-center gap-2 font-label-sm text-label-sm text-primary transition-colors hover:text-tertiary"
                href={`tel:${location.phone.replace(/\s/g, '')}`}
              >
                <Phone size={15} strokeWidth={2} />
                {location.phone}
              </a>
            ) : null}
            {location.email ? (
              <a
                className="flex items-center gap-2 break-all font-label-sm text-label-sm text-primary transition-colors hover:text-tertiary"
                href={`mailto:${location.email}`}
              >
                <Mail size={15} strokeWidth={2} />
                {location.email}
              </a>
            ) : null}
          </div>
        )}

        <a
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-label-sm text-label-sm text-white transition-transform hover:scale-[1.01] hover:bg-secondary sm:py-3.5"
          href={directionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Navigation size={16} strokeWidth={2} />
          {directionsLabel}
        </a>
      </div>
    </article>
  )
}
