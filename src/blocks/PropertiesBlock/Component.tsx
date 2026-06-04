'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media as PayloadMedia, Page } from '@/payload-types'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { useReveal, activateRevealElements } from '@/utilities/useReveal'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { postToCRM } from '@/utilities/crmApi'
import {
  parseCRMCustomQuery,
  normalizeCRMProperty as normalizeSharedCRMProperty,
} from '@/utilities/crmProperties'
import { PROPERTY_CARD_IMAGE_SIZE } from '@/utilities/optimaImage'
import { cn } from '@/utilities/ui'
import { useSiteLocale } from '@/utilities/useSiteLocale'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }>

const CARDS_PER_VIEW_DESKTOP = 3
const CARDS_PER_VIEW_MOBILE = 1
const DESKTOP_MEDIA = '(min-width: 48rem)' // matches --breakpoint-md
const AUTO_PLAY_DELAY = 5000 // 5 seconds
const GAP_PX = 24 // matches gap-6 (1.5rem = 24px)

type NormalizedProperty = {
  id?: string
  imageResource?: PayloadMedia
  imageUrl?: string
  imageUrls?: string[]
  isNewListing?: boolean
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  location: string
  reference?: string
  title: string
  beds?: number
  baths?: number
  sqft?: number | string
  price: string
}

type CRMQueryPreset = 'featured' | 'seaView' | 'custom'

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(() => {
    if (typeof window === 'undefined') return CARDS_PER_VIEW_DESKTOP
    return window.matchMedia(DESKTOP_MEDIA).matches ? CARDS_PER_VIEW_DESKTOP : CARDS_PER_VIEW_MOBILE
  })

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const update = () =>
      setCardsPerView(mq.matches ? CARDS_PER_VIEW_DESKTOP : CARDS_PER_VIEW_MOBILE)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return cardsPerView
}

const SKELETON_CARD_COUNT = CARDS_PER_VIEW_DESKTOP

const PropertyCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-4 animate-pulse', className)}>
    <div className="rounded-xl h-[280px] md:h-[400px] bg-surface-container-high" />
    <div className="h-4 w-2/3 rounded bg-surface-container-high" />
    <div className="h-6 w-full rounded bg-surface-container-high" />
  </div>
)

export const PropertiesBlock: React.FC<Props> = ({
  subtitle,
  title,
  backgroundColor,
  showSoldBadge,
  properties,
  dataSource,
  crmPreset,
  crmLimit,
  crmQueryJson,
}) => {
  const sectionRef = useReveal<HTMLElement>()
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardsPerView = useCardsPerView()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  /** Pauses block auto-play while the user hovers or uses a card image gallery */
  const [isCardEngaged, setIsCardEngaged] = useState(false)
  const engagedCardsRef = useRef(new Set<string>())
  const [crmRawProperties, setCrmRawProperties] = useState<Record<string, unknown>[]>([])
  const [crmLoading, setCrmLoading] = useState(() => (dataSource ?? 'cms') === 'crm')
  const activeLocale = useSiteLocale()
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const source = dataSource ?? 'cms'
  const crmQueryType = (crmPreset ?? 'featured') as CRMQueryPreset
  const resolvedLimit = Math.max(1, crmLimit ?? 5)

  const normalizeCRMProperty = useCallback(
    (property: Record<string, unknown>): NormalizedProperty => {
      const normalized = normalizeSharedCRMProperty(property, activeLocale, {
        currencySymbolAfter: true,
        emptyPriceWhenMissing: true,
        attachmentImageSize: PROPERTY_CARD_IMAGE_SIZE,
      })

      return {
        id: normalized.id,
        imageUrl: normalized.imageUrl,
        imageUrls: normalized.imageUrls,
        isNewListing: normalized.isNewListing,
        statusBadgeLabel: normalized.statusBadgeLabel,
        location: normalized.location,
        reference: normalized.reference,
        title: normalized.title,
        beds: normalized.beds,
        baths: normalized.baths,
        sqft: normalized.sqft,
        price: normalized.price,
      }
    },
    [activeLocale],
  )

  const crmProperties = useMemo(
    () => crmRawProperties.map(normalizeCRMProperty),
    [crmRawProperties, normalizeCRMProperty],
  )

  const buildCRMQuery = useCallback(() => {
    if (crmQueryType === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
      const parsedQuery = parseCRMCustomQuery(crmQueryJson)
      if (parsedQuery) {
        const parsedOptions =
          parsedQuery.options && typeof parsedQuery.options === 'object'
            ? (parsedQuery.options as Record<string, unknown>)
            : {}

        return {
          ...parsedQuery,
          options: {
            ...parsedOptions,
            page: 1,
            limit: resolvedLimit,
          },
        }
      }

      console.error('Invalid CRM custom query JSON. Sending empty custom query.')
      return {
        options: {
          page: 1,
          limit: resolvedLimit,
        },
        query: {},
      }
    }

    if (crmQueryType === 'seaView') {
      return {
        options: {
          page: 1,
          limit: resolvedLimit,
        },
        query: {
          similar_commercials: 'exclude_similar',
          $and: [{ 'views.sea': true }],
          sale: true,
          status: { $in: ['Available', 'Under Offer'] },
        },
      }
    }

    return {
      options: {
        page: 1,
        limit: resolvedLimit,
      },
      query: {
        similar_commercials: 'exclude_similar',
        sale: true,
        featured: true,
        status: { $in: ['Available', 'Under Offer'] },
      },
    }
  }, [crmQueryJson, crmQueryType, resolvedLimit])

  const extractCRMList = (payload: unknown): Record<string, unknown>[] => {
    if (Array.isArray(payload)) {
      return payload.filter(
        (item): item is Record<string, unknown> => !!item && typeof item === 'object',
      )
    }

    if (payload && typeof payload === 'object') {
      const asRecord = payload as Record<string, unknown>
      const knownCollections = ['data', 'docs', 'results', 'items', 'commercial_properties']

      for (const key of knownCollections) {
        const value = asRecord[key]
        if (Array.isArray(value)) {
          return value.filter(
            (item): item is Record<string, unknown> => !!item && typeof item === 'object',
          )
        }
      }
    }

    return []
  }

  const normalizedCMSProperties: NormalizedProperty[] =
    properties?.map((property) => ({
      imageResource:
        typeof property.image === 'object' && property.image !== null ? property.image : undefined,
      isNewListing: property.isNewListing ?? false,
      location: property.location || 'Greece',
      reference: undefined,
      title: property.title || 'Property',
      beds: property.beds ?? undefined,
      baths: property.baths ?? undefined,
      sqft: property.sqft ?? undefined,
      price: property.price || 'Price on request',
    })) ?? []

  const displayProperties = source === 'crm' ? crmProperties : normalizedCMSProperties

  const bgClass =
    backgroundColor === 'surface-container-low' ? 'bg-surface-container-low' : 'bg-surface'

  const total = displayProperties.length
  const maxIndex = Math.max(0, total - cardsPerView)

  useEffect(() => {
    if (source !== 'crm') {
      setCrmRawProperties([])
      setCrmLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchProperties = async () => {
      setCrmLoading(true)
      try {
        const response = await postToCRM('commercial_properties', buildCRMQuery(), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`CRM API failed (${response.status})`)
        }

        const data = (await response.json()) as unknown
        setCrmRawProperties(extractCRMList(data))
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch CRM properties.', error)
          setCrmRawProperties([])
        }
      } finally {
        if (!controller.signal.aborted) setCrmLoading(false)
      }
    }

    void fetchProperties()

    return () => controller.abort()
  }, [buildCRMQuery, source])

  // Keep slide index valid when switching between 1-up (mobile) and 3-up (desktop)
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentIndex(Math.max(0, Math.min(maxIndex, index)))
      setTimeout(() => setIsTransitioning(false), 600)
    },
    [isTransitioning, maxIndex],
  )

  const handlePrev = useCallback(() => {
    goTo(currentIndex <= 0 ? maxIndex : currentIndex - 1)
  }, [currentIndex, maxIndex, goTo])

  const handleNext = useCallback(() => {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1)
  }, [currentIndex, maxIndex, goTo])

  const pauseAutoPlay = useCallback((cardKey: string) => {
    engagedCardsRef.current.add(cardKey)
    setIsCardEngaged(true)
  }, [])

  const resumeAutoPlay = useCallback((cardKey: string) => {
    engagedCardsRef.current.delete(cardKey)
    setIsCardEngaged(engagedCardsRef.current.size > 0)
  }, [])

  // Auto-play — paused when hovering the track or any property card / gallery
  useEffect(() => {
    if (isPaused || isCardEngaged || total <= cardsPerView) return

    autoPlayRef.current = setInterval(() => {
      handleNext()
    }, AUTO_PLAY_DELAY)

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isPaused, isCardEngaged, handleNext, total, cardsPerView])

  // Size and slide distance must use the viewport (container), not the flex track.
  // Plain % resolves against the track width (all cards), which causes partial 4th-card peeks.
  const cardWidth = `calc((100cqw - ${GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const translateX = `calc(-${currentIndex} * (100cqw + ${GAP_PX}px) / ${cardsPerView})`

  const hasProperties = total > 0
  const showCrmLoading = source === 'crm' && crmLoading

  useLayoutEffect(() => {
    if (!hasProperties || showCrmLoading) return
    activateRevealElements(carouselRef.current)
    activateRevealElements(sectionRef.current)
  }, [hasProperties, showCrmLoading, crmRawProperties.length])

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${bgClass}`}>
      {/* Header row */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end reveal">
        <div>
          {subtitle && (
            <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary mt-2">
            {title}
          </h2>
        </div>
        {hasProperties && !showCrmLoading && (
          <div className="flex gap-3 md:gap-4 shrink-0">
            <button
              onClick={handlePrev}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {showCrmLoading ? (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
              <PropertyCardSkeleton key={i} className={cn(i > 0 && 'hidden md:block')} />
            ))}
          </div>
        </div>
      ) : hasProperties ? (
        /* Carousel viewport — @container so 100cqw = visible width (exactly N cards, no peek) */
        <div
          ref={carouselRef}
          className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal active overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-600 ease-in-out"
            style={{
              gap: `${GAP_PX}px`,
              transform: `translateX(${translateX})`,
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {displayProperties.map((property, idx) => {
              const cardKey = property.id ?? property.reference ?? String(idx)
              return (
                <PropertyCard
                  key={cardKey}
                  propertyId={property.id}
                  property={property}
                  statusBadgeLabel={resolvePropertyCardStatusBadge({
                    statusBadgeLabel: property.statusBadgeLabel,
                    showSoldBadge: Boolean(showSoldBadge),
                    useCrmStatus: source === 'crm',
                  })}
                  variant={
                    backgroundColor === 'surface-container-low'
                      ? 'surface-container-low'
                      : 'surface'
                  }
                  className="shrink-0"
                  style={{ width: cardWidth }}
                  onCardEngage={() => pauseAutoPlay(cardKey)}
                  onCardRelease={() => resumeAutoPlay(cardKey)}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal">
          <SectionEmptyState
            eyebrow="Listings"
            title="No properties found"
            description="We could not find any listings for this selection. Try another filter or check again soon."
            tone={backgroundColor === 'surface-container-low' ? 'muted' : 'surface'}
          />
        </div>
      )}

      {/* Dot indicators */}
      {total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex ? 'w-8 bg-tertiary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
