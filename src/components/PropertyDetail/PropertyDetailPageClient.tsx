'use client'

import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { PropertyDetailView } from '@/components/PropertyDetail/PropertyDetailView'
import { normalizeCRMAmenities, normalizeCRMPropertyEnergy } from '@/utilities/crmAmenities'
import { fetchCRMPropertyDetail, fetchCRMRelatedProperties } from '@/utilities/crmPropertyDetail'
import { normalizeCRMListProperty, normalizeCRMProperty } from '@/utilities/crmProperties'
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
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <div className="aspect-[4/3] rounded-lg bg-surface-container-high" />
          <div className="space-y-6 py-2">
            <div className="h-4 w-48 rounded bg-surface-container-high" />
            <div className="h-16 w-full rounded bg-surface-container-high" />
            <div className="h-8 w-40 rounded bg-surface-container-high" />
            <div className="h-12 w-56 rounded bg-surface-container-high" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-surface-container-high" />
              <div className="h-4 w-5/6 rounded bg-surface-container-high" />
              <div className="h-4 w-4/6 rounded bg-surface-container-high" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export const PropertyDetailPageClient: React.FC = () => {
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
  const [brochureUrl, setBrochureUrl] = useState<string | undefined>()
  const [videos, setVideos] = useState<ReturnType<typeof resolveCRMPropertyVideos>>([])

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
        setBrochureUrl(buildPropertyBrochurePdfUrl(raw, activeLocale))
        setVideos(resolveCRMPropertyVideos(raw, activeLocale))
        setAmenities(normalizeCRMAmenities(raw))
        setEnergy(normalizeCRMPropertyEnergy(raw))
        setLatitude(pickNumber(raw.latitude) ?? pickNumber(raw.lat))
        setLongitude(pickNumber(raw.longitude) ?? pickNumber(raw.lng))

        document.title = `${normalized.title} | Roumpos Real Estate`

        const similarRefs = Array.isArray(raw.similar_commercials)
          ? (raw.similar_commercials as Array<string | number>)
          : []

        if (similarRefs.length > 0) {
          const relatedRaw = await fetchCRMRelatedProperties(similarRefs, 3)
          if (!controller.signal.aborted) {
            setRelatedProperties(
              relatedRaw
                .map((item) => normalizeCRMListProperty(item, activeLocale))
                .filter((item) => item.reference !== normalized.reference),
            )
          }
        } else {
          setRelatedProperties([])
        }
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
      property={property}
      amenities={amenities}
      energy={energy}
      relatedProperties={relatedProperties}
      brochureUrl={brochureUrl}
      videos={videos}
      latitude={latitude}
      longitude={longitude}
    />
  )
}
