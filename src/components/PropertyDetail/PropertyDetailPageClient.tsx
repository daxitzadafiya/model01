'use client'

import { notFound, useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { PropertyDetailView } from '@/components/PropertyDetail/PropertyDetailView'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeCRMAmenities, normalizeCRMPropertyEnergy } from '@/utilities/crmAmenities'
import { fetchCRMPropertyDetail } from '@/utilities/crmPropertyDetail'
import {
  resolvePropertyDetailFetchStatuses,
  takePropertyDetailFetchStatus,
} from '@/utilities/propertyDetailFetchStatus'
import {
  parsePropertyDetailForQuery,
  resolvePropertyDetailHolidayMode,
  takePropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'
import {
  fetchCRMSimilarProperties,
  isSimilarPropertySold,
  resolveSimilarListingContext,
} from '@/utilities/crmSimilarProperties'
import type { Form } from '@/payload-types'
import { normalizeCRMListProperty, normalizeCRMProperty } from '@/utilities/crmProperties'
import { parseCRMPropertyBookings } from '@/utilities/crmHoliday'
import { parseRentalSeasons } from '@/utilities/holidayRentalPricing'
import {
  extractPropertyInquiryContext,
  type PropertyInquiryContext,
} from '@/utilities/propertyInquiry'
import { PROPERTY_DETAIL_IMAGE_SIZE } from '@/utilities/optimaImage'
import { resolveCRMPropertyVideos } from '@/utilities/crmPropertyVideo'
import { buildPropertyBrochurePdfUrl } from '@/utilities/propertyBrochure'
import { extractReferenceFromSlug } from '@/utilities/propertyUrl'
import { useSiteLocale } from '@/utilities/useSiteLocale'

const pickNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function PropertyDetailSkeleton() {
  return (
    <main className="pt-28 bg-surface-bright">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <Skeleton className="lg:col-span-7 xl:col-span-8 aspect-[4/3] rounded-lg" />
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 py-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-12 w-56 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

type Props = {
  contactForm?: Form | null
}

export const PropertyDetailPageClient: React.FC<Props> = ({ contactForm }) => {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const activeLocale = useSiteLocale()
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  const [property, setProperty] = useState<ReturnType<typeof normalizeCRMProperty> | null>(null)
  const [amenities, setAmenities] = useState<ReturnType<typeof normalizeCRMAmenities>>([])
  const [energy, setEnergy] = useState<ReturnType<typeof normalizeCRMPropertyEnergy>>(null)
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [relatedProperties, setRelatedProperties] = useState<
    ReturnType<typeof normalizeCRMListProperty>[]
  >([])
  const [similarPropertiesLoading, setSimilarPropertiesLoading] = useState(false)
  const [showSimilarSoldBadge, setShowSimilarSoldBadge] = useState(false)
  const [brochureUrl, setBrochureUrl] = useState<string | undefined>()
  const [videos, setVideos] = useState<ReturnType<typeof resolveCRMPropertyVideos>>([])
  const [inquiry, setInquiry] = useState<PropertyInquiryContext>({})
  const [isHolidayRental, setIsHolidayRental] = useState(false)
  const [rentalSeasons, setRentalSeasons] = useState<ReturnType<typeof parseRentalSeasons>>([])
  const [bookings, setBookings] = useState<ReturnType<typeof parseCRMPropertyBookings>>([])
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false)

  const slug = decodeURIComponent(params.slug ?? '')

  /** Soft-refresh holiday bookings/calendar without remounting the whole page. */
  const refreshBookings = useCallback(async () => {
    const reference = extractReferenceFromSlug(slug)
    if (!reference) return

    setBookingsRefreshing(true)
    try {
      const statuses = resolvePropertyDetailFetchStatuses({
        crmStatus: property?.crmStatus,
        statusBadgeLabel: property?.statusBadgeLabel,
      })
      let raw = await fetchCRMPropertyDetail(reference, { statuses })
      if (!raw && !statuses?.length) {
        raw = await fetchCRMPropertyDetail(reference, { statuses: ['Sold'] })
      }
      if (!raw) return

      setBookings(parseCRMPropertyBookings(raw))
      setRentalSeasons(parseRentalSeasons(raw))
    } catch (error) {
      console.error('Failed to refresh holiday bookings', error)
    } finally {
      setBookingsRefreshing(false)
    }
  }, [property?.crmStatus, property?.statusBadgeLabel, slug])
  const holidayArrival = searchParams.get('periodFrom')?.trim() ?? ''
  const holidayDeparture = searchParams.get('periodTo')?.trim() ?? ''
  const guestsParam = searchParams.get('guests')?.trim() ?? ''
  const guestsCustomParam = searchParams.get('guestsCustom')?.trim() ?? ''
  const holidayGuests =
    guestsParam === 'other' && guestsCustomParam
      ? guestsCustomParam
      : guestsParam || '2'
  const forQuery = searchParams.get('for')?.trim() ?? ''
  const hasHolidaySearchParams = Boolean(
    holidayArrival ||
      holidayDeparture ||
      (holidayGuests && holidayGuests !== '2'),
  )

  useEffect(() => {
    if (!slug) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const reference = extractReferenceFromSlug(slug)
    if (!reference) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const listingContext =
      parsePropertyDetailForQuery(forQuery) ?? takePropertyDetailListingContext(reference)

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setNotFoundState(false)

      try {
        const statuses = takePropertyDetailFetchStatus(reference)
        let raw = await fetchCRMPropertyDetail(reference, {
          statuses,
          init: { signal: controller.signal },
        })
        if (controller.signal.aborted) return

        if (!raw && !statuses?.length) {
          raw = await fetchCRMPropertyDetail(reference, {
            statuses: ['Sold'],
            init: { signal: controller.signal },
          })
          if (controller.signal.aborted) return
        }

        if (!raw) {
          setNotFoundState(true)
          return
        }

        const isHolidayDetail = resolvePropertyDetailHolidayMode(listingContext, raw, {
          hasHolidaySearchParams,
        })

        const normalized = normalizeCRMProperty(raw, activeLocale, {
          attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
          holidayListing: isHolidayDetail,
          holidayPeriodFrom: holidayArrival,
          holidayPeriodTo: holidayDeparture,
          holidayGuests,
          holidayPriceVariant: 'detail',
        })

        setProperty(normalized)
        setIsHolidayRental(isHolidayDetail)
        setRentalSeasons(parseRentalSeasons(raw))
        setBookings(parseCRMPropertyBookings(raw))
        setInquiry(extractPropertyInquiryContext(raw, normalized, listingContext))
        setBrochureUrl(buildPropertyBrochurePdfUrl(raw, activeLocale))
        setVideos(resolveCRMPropertyVideos(raw, activeLocale))
        setAmenities(normalizeCRMAmenities(raw))
        setEnergy(normalizeCRMPropertyEnergy(raw))
        setLatitude(pickNumber(raw.latitude) ?? pickNumber(raw.lat))
        setLongitude(pickNumber(raw.longitude) ?? pickNumber(raw.lng))

        document.title = `${normalized.title} | Roumpos Real Estate`

        const similarListingContext = resolveSimilarListingContext(raw)
        setShowSimilarSoldBadge(isSimilarPropertySold(raw))
        setSimilarPropertiesLoading(true)
        setRelatedProperties([])

        void (async () => {
          try {
            const similarRaw = await fetchCRMSimilarProperties({
              property: raw,
              limit: 5,
              listingContext: similarListingContext,
              signal: controller.signal,
            })

            if (!controller.signal.aborted) {
              setRelatedProperties(
                similarRaw.map((item) =>
                  normalizeCRMListProperty(item, activeLocale, {
                    listingMode: similarListingContext === 'rent' ? 'rent' : 'sale',
                  }),
                ),
              )
            }
          } catch (similarError) {
            if ((similarError as Error).name !== 'AbortError') {
              console.error('Failed to load similar properties', similarError)
              if (!controller.signal.aborted) setRelatedProperties([])
            }
          } finally {
            if (!controller.signal.aborted) setSimilarPropertiesLoading(false)
          }
        })()
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('Failed to load property detail', error)
        setNotFoundState(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [
    slug,
    activeLocale,
    holidayArrival,
    holidayDeparture,
    holidayGuests,
    forQuery,
    hasHolidaySearchParams,
  ])

  if (loading) return <PropertyDetailSkeleton />

  if (notFoundState || !property) {
    notFound()
  }

  return (
    <PropertyDetailView
      contactForm={contactForm}
      inquiry={inquiry}
      property={property}
      amenities={amenities}
      energy={energy}
      relatedProperties={relatedProperties}
      similarPropertiesLoading={similarPropertiesLoading}
      showSimilarSoldBadge={showSimilarSoldBadge}
      brochureUrl={brochureUrl}
      videos={videos}
      latitude={latitude}
      longitude={longitude}
      isHolidayRental={isHolidayRental}
      rentalSeasons={rentalSeasons}
      bookings={bookings}
      bookingsRefreshing={bookingsRefreshing}
      onRefreshBookings={refreshBookings}
      holidayArrival={holidayArrival}
      holidayDeparture={holidayDeparture}
      holidayGuests={holidayGuests}
    />
  )
}
