'use client'

import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { PropertyDetailView } from '@/components/PropertyDetail/PropertyDetailView'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeCRMAmenities, normalizeCRMPropertyEnergy } from '@/utilities/crmAmenities'
import { fetchCRMPropertyDetail } from '@/utilities/crmPropertyDetail'
import {
  fetchCRMSimilarProperties,
  isSimilarPropertySold,
  resolveSimilarListingContext,
} from '@/utilities/crmSimilarProperties'
import type { Form } from '@/payload-types'
import { normalizeCRMListProperty, normalizeCRMProperty } from '@/utilities/crmProperties'
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

  const slug = decodeURIComponent(params.slug ?? '')

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

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setNotFoundState(false)

      try {
        const raw = await fetchCRMPropertyDetail(reference, { signal: controller.signal })
        if (controller.signal.aborted) return

        if (!raw) {
          setNotFoundState(true)
          return
        }

        const normalized = normalizeCRMProperty(raw, activeLocale, {
          attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
        })

        setProperty(normalized)
        setInquiry(extractPropertyInquiryContext(raw, normalized))
        setBrochureUrl(buildPropertyBrochurePdfUrl(raw, activeLocale))
        setVideos(resolveCRMPropertyVideos(raw, activeLocale))
        setAmenities(normalizeCRMAmenities(raw))
        setEnergy(normalizeCRMPropertyEnergy(raw))
        setLatitude(pickNumber(raw.latitude) ?? pickNumber(raw.lat))
        setLongitude(pickNumber(raw.longitude) ?? pickNumber(raw.lng))

        document.title = `${normalized.title} | Roumpos Real Estate`

        const listingContext = resolveSimilarListingContext(raw)
        setShowSimilarSoldBadge(isSimilarPropertySold(raw))
        setSimilarPropertiesLoading(true)
        setRelatedProperties([])

        void (async () => {
          try {
            console.log('fetching similar properties')
            const similarRaw = await fetchCRMSimilarProperties({
              property: raw,
              limit: 5,
              listingContext,
              signal: controller.signal,
            })

            if (!controller.signal.aborted) {
              setRelatedProperties(
                similarRaw.map((item) =>
                  normalizeCRMListProperty(item, activeLocale, {
                    listingMode: listingContext === 'rent' ? 'rent' : 'sale',
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
  }, [slug, activeLocale])

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
    />
  )
}
