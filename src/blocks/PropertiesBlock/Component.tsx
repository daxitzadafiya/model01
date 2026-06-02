'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Bath, Bed, ChevronLeft, ChevronRight, Heart, Ruler } from 'lucide-react'
import type { Media as PayloadMedia, Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { PropertyImagePlaceholder } from '@/components/PropertyImagePlaceholder'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { getPublishedPropertyAttachmentImage } from '@/utilities/optimaImage'
import { getLocalizedText } from '@/utilities/localizedValue'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }>

const CARDS_PER_VIEW_DESKTOP = 3
const CARDS_PER_VIEW_MOBILE = 1
const DESKTOP_MEDIA = '(min-width: 48rem)' // matches --breakpoint-md
const AUTO_PLAY_DELAY = 5000 // 5 seconds
const GAP_PX = 24 // matches gap-6 (1.5rem = 24px)

type NormalizedProperty = {
  imageResource?: PayloadMedia
  imageUrl?: string
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

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate : fallback

const resolveCRMStatusBadgeLabel = (status: unknown): 'SOLD' | 'RESERVED' | undefined => {
  const normalizedStatus = pickString(status).toLowerCase()
  if (normalizedStatus === 'sold') return 'SOLD'
  if (normalizedStatus === 'under offer') return 'RESERVED'
  return undefined
}

const parseCRMCustomQuery = (rawQuery: string): Record<string, unknown> | undefined => {
  const trimmedQuery = rawQuery.trim()
  if (!trimmedQuery) return undefined

  const parseCandidates = [trimmedQuery]
  if (!trimmedQuery.startsWith('{')) {
    parseCandidates.push(`{${trimmedQuery}}`)
  }

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue

      const asRecord = parsed as Record<string, unknown>
      const hasQueryContainer = asRecord.query && typeof asRecord.query === 'object'
      if (hasQueryContainer) return asRecord

      // Support providing only the query object in admin without wrapping in { "query": ... }.
      return { query: asRecord }
    } catch {
      // Try the next parse candidate.
    }
  }

  return undefined
}

const pickNumber = (candidate: unknown) => {
  if (typeof candidate === 'number') return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const isPriceOnDemandEnabled = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }
  return false
}

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(CARDS_PER_VIEW_MOBILE)

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
  const sectionRef = useReveal()
  const cardsPerView = useCardsPerView()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [crmProperties, setCrmProperties] = useState<NormalizedProperty[]>([])
  const [activeLocale, setActiveLocale] = useState('en')
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const source = dataSource ?? 'cms'
  const crmQueryType = (crmPreset ?? 'featured') as CRMQueryPreset
  const resolvedLimit = Math.max(1, crmLimit ?? 5)

  useEffect(() => {
    const htmlLocale = document?.documentElement?.lang || 'en'
    setActiveLocale(htmlLocale)
  }, [])

  const normalizeCRMProperty = useCallback(
    (property: Record<string, unknown>): NormalizedProperty => {
      const images = Array.isArray(property.images) ? property.images : []
      const propertyAttachments = Array.isArray(property.property_attachments)
        ? property.property_attachments
        : []
      const firstImage = images.find(
        (image): image is Record<string, unknown> => !!image && typeof image === 'object',
      )
      const imageUrl =
        getPublishedPropertyAttachmentImage(propertyAttachments, 1000) ||
        pickString(firstImage?.url) ||
        pickString(firstImage?.full) ||
        pickString(firstImage?.large) ||
        pickString(firstImage?.medium) ||
        pickString(firstImage?.small) ||
        pickString(property.main_image) ||
        pickString(property.image)

      const location =
        pickString(property.area) ||
        pickString(property.area_name) ||
        pickString(property.city_name) ||
        pickString(property.region_name) ||
        getLocalizedText(property.location_value, activeLocale) ||
        getLocalizedText(property.city_value, activeLocale) ||
        pickString(property.city) ||
        pickString(property.location)

      const propertyTitle =
        pickString(property.sale_title) ||
        getLocalizedText(property.title, activeLocale) ||
        pickString(property.title) ||
        pickString(property.display_name) ||
        pickString(property.name) ||
        getLocalizedText(property.type_one_value, activeLocale) ||
        pickString(property.property_type)

      const beds = pickNumber(property.bedrooms) ?? pickNumber(property.beds)
      const baths = pickNumber(property.bathrooms) ?? pickNumber(property.baths)
      const size =
        pickNumber(property.built) ??
        pickNumber(property.m2_built) ??
        pickNumber(property.covered_area) ??
        pickNumber(property.internal_area) ??
        pickNumber(property.sqft)
      const dimensions = pickString(property.dimensions, 'Metres')
      const sizeWithUnit = size
        ? `${size}${dimensions === 'Metres' ? 'm²' : 'ft²'}`
        : `0${dimensions === 'Metres' ? 'm²' : 'ft²'}`

      const rawPrice =
        property.price ?? property.current_price ?? property.sale_price ?? property.list_price
      const hasPriceOnDemand = isPriceOnDemandEnabled(property.price_on_demand)
      const formattedRawPrice =
        typeof rawPrice === 'number'
          ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rawPrice)
          : pickString(rawPrice)
      const price = formattedRawPrice && !hasPriceOnDemand ? `${formattedRawPrice} €` : ''
      const resolvedPrice = hasPriceOnDemand ? 'Price on demand' : price
      const referenceRaw = property.reference
      const reference =
        typeof referenceRaw === 'number' ? String(referenceRaw) : pickString(referenceRaw)
      const statusBadgeLabel = resolveCRMStatusBadgeLabel(property.status)

      return {
        imageUrl,
        isNewListing: Boolean(property.featured),
        statusBadgeLabel,
        location: location || 'Greece',
        reference,
        title: propertyTitle || 'Property',
        beds,
        baths,
        // Keep the same card layout while showing unit-aware built area text.
        // `sqft` slot in the card is reused to display "4852m²"/"4852ft²".
        sqft: sizeWithUnit,
        price: resolvedPrice,
      }
    },
    [activeLocale],
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
            limit: resolvedLimit,
            ...parsedOptions,
          },
        }
      }

      console.error('Invalid CRM custom query JSON. Sending empty custom query.')
      return {
        options: {
          limit: resolvedLimit,
        },
        query: {},
      }
    }

    if (crmQueryType === 'seaView') {
      return {
        options: {
          limit: resolvedLimit,
        },
        query: {
          similar_commercials: 'include_similar',
          $and: [{ 'views.sea': true }],
          sale: true,
          status: { $in: ['Available', 'Under Offer'] },
        },
      }
    }

    return {
      options: {
        limit: resolvedLimit,
      },
      query: {
        similar_commercials: 'include_similar',
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
      setCrmProperties([])
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_CRM_API_URL
    const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY

    if (!apiUrl || !apiKey) {
      console.error('Missing NEXT_PUBLIC_CRM_API_URL or NEXT_PUBLIC_CRM_API_KEY')
      setCrmProperties([])
      return
    }

    const controller = new AbortController()

    const fetchProperties = async () => {
      try {
        const baseUrl = apiUrl.replace(/\/+$/, '')
        const endpoint = `${baseUrl}/commercial_properties?user_apikey=${encodeURIComponent(apiKey)}`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildCRMQuery()),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`CRM API failed (${response.status})`)
        }

        const data = (await response.json()) as unknown
        const list = extractCRMList(data).map(normalizeCRMProperty)
        setCrmProperties(list)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch CRM properties.', error)
          setCrmProperties([])
        }
      }
    }

    void fetchProperties()

    return () => controller.abort()
  }, [buildCRMQuery, normalizeCRMProperty, source])

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

  // Auto-play
  useEffect(() => {
    if (isPaused || total <= cardsPerView) return

    autoPlayRef.current = setInterval(() => {
      handleNext()
    }, AUTO_PLAY_DELAY)

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isPaused, handleNext, total, cardsPerView])

  // Size and slide distance must use the viewport (container), not the flex track.
  // Plain % resolves against the track width (all cards), which causes partial 4th-card peeks.
  const cardWidth = `calc((100cqw - ${GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const translateX = `calc(-${currentIndex} * (100cqw + ${GAP_PX}px) / ${cardsPerView})`

  const cardBase =
    backgroundColor === 'surface-container-low'
      ? 'bg-surface rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-500'
      : ''

  const imageWrapperClass =
    backgroundColor === 'surface-container-low'
      ? 'relative overflow-hidden h-[240px] md:h-[300px]'
      : 'relative overflow-hidden rounded-xl h-[280px] md:h-[400px]'

  const cardInfoClass = backgroundColor === 'surface-container-low' ? 'p-4 md:p-6' : 'mt-4 md:mt-2'
  const hasProperties = total > 0

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
        {hasProperties && (
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

      {hasProperties ? (
        /* Carousel viewport — @container so 100cqw = visible width (exactly N cards, no peek) */
        <div
          className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal overflow-hidden"
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
              const statusBadgeLabel =
                source === 'crm' ? property.statusBadgeLabel : showSoldBadge ? 'SOLD' : undefined
              return (
                <div
                  key={idx}
                  className={`group cursor-pointer shrink-0 ${cardBase}`}
                  style={{ width: cardWidth }}
                >
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
                      <span className="font-body-md text-body-md font-bold text-primary">
                        {property.price}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface py-3 font-label-nav text-label-nav text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      View Property
                      {/* hover  */}
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform duration-300"
                      />
                    </button>
                  </div>
                </div>
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
