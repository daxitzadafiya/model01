'use client'

import Link from 'next/link'
import React from 'react'
import { MapPin } from 'lucide-react'

import {
  PropertyDetailFavoriteButton,
  PropertyDetailFooterActions,
} from '@/components/PropertyDetail/PropertyDetailActions'
import { PropertyDetailAmenities } from '@/components/PropertyDetail/PropertyDetailAmenities'
import { PropertyDetailEnergy } from '@/components/PropertyDetail/PropertyDetailEnergy'
import { PropertyDetailGallery } from '@/components/PropertyDetail/PropertyDetailGallery'
import { PropertyDetailInquiryForm } from '@/components/PropertyDetail/PropertyDetailInquiryForm'
import { PropertyDetailMap } from '@/components/PropertyDetail/PropertyDetailMap'
import { PropertyDetailRelated } from '@/components/PropertyDetail/PropertyDetailRelated'
import { PropertyDetailSpecs } from '@/components/PropertyDetail/PropertyDetailSpecs'
import { PropertyDetailVideo } from '@/components/PropertyDetail/PropertyDetailVideo'
import type { CRMAmenity, CRMPropertyEnergy } from '@/utilities/crmAmenities'
import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import type { Form } from '@/payload-types'
import {
  resolveCRMStatusBadgeLabel,
  type NormalizedCRMProperty,
  type NormalizedListProperty,
} from '@/utilities/crmProperties'
import type { PropertyInquiryContext } from '@/utilities/propertyInquiry'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  property: NormalizedCRMProperty
  amenities: CRMAmenity[]
  energy: CRMPropertyEnergy | null
  relatedProperties: NormalizedListProperty[]
  similarPropertiesLoading?: boolean
  showSimilarSoldBadge?: boolean
  brochureUrl?: string
  videos?: CRMPropertyVideoItem[]
  latitude?: number
  longitude?: number
  portfolioHref?: string
}

const renderDescription = (description?: string) => {
  if (!description?.trim()) return null

  const trimmed = description.trim()
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed)

  if (looksLikeHtml) {
    return (
      <div
        className="space-y-6 text-body-lg font-body-lg text-on-surface-variant description-container"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    )
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div className="space-y-6 text-body-lg font-body-lg text-on-surface-variant description-container">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}

export const PropertyDetailView: React.FC<Props> = ({
  contactForm,
  inquiry,
  property,
  amenities,
  energy,
  relatedProperties,
  similarPropertiesLoading = false,
  showSimilarSoldBadge = false,
  brochureUrl,
  videos = [],
  latitude,
  longitude,
  portfolioHref,
}) => {
  const locationSubtitle = [property.city, property.region].filter(Boolean).join(', ')
  const bedroomSingular = useTranslation('propertyDetail.specs.bedroomSingular', 'Bedroom')
  const bedroomPlural = useTranslation('propertyDetail.specs.bedroomPlural', 'Bedrooms')
  const bathSingular = useTranslation('propertyDetail.specs.bathSingular', 'Bath')
  const bathPlural = useTranslation('propertyDetail.specs.bathPlural', 'Baths')
  const refPrefixLabel = useTranslation('propertyDetail.map.refPrefix', 'Ref:')
  const livingAreaLabel = useTranslation('propertyDetail.specs.livingArea', 'Living Area')
  const bedroomsLabel = useTranslation('propertyDetail.specs.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyDetail.specs.bathrooms', 'Bathrooms')
  const propertyTypeLabel = useTranslation('propertyDetail.specs.propertyType', 'Property Type')
  const homeLabel = useTranslation('homeLabel', 'Home')
  const propertiesLabel = useTranslation('propertiesLabel', 'Properties')
  const listHref = portfolioHref || '/'

  const specItems = [
    property.sqft
      ? { icon: 'straighten', label: livingAreaLabel, value: String(property.sqft) }
      : null,
    property.beds != null
      ? {
          icon: 'bed',
          label: bedroomsLabel,
          value: `${property.beds} ${property.beds === 1 ? bedroomSingular : bedroomPlural}`,
        }
      : null,
    property.baths != null
      ? {
          icon: 'bathtub',
          label: bathroomsLabel,
          value: `${property.baths} ${property.baths === 1 ? bathSingular : bathPlural}`,
        }
      : null,
    property.propertyType
      ? { icon: 'villa', label: propertyTypeLabel, value: property.propertyType }
      : null,
  ].filter((item): item is { icon: string; label: string; value: string } => Boolean(item))

  return (
    <main className="pt-20 md:pt-24 lg:pt-28 bg-surface-bright text-on-surface">
      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start mb-16 md:mb-24">
        <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-32 lg:self-start">
          <PropertyDetailGallery
            images={property.imageUrls ?? (property.imageUrl ? [property.imageUrl] : [])}
            title={property.title}
            badgeLabel={resolveCRMStatusBadgeLabel(property.statusBadgeLabel)}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full py-2">
          <nav className="flex flex-wrap gap-x-2 text-label-sm font-label-sm text-on-surface-variant uppercase mb-4">
            <Link className="hover:text-tertiary transition-colors" href="/">
              {homeLabel}
            </Link>
            <span>/</span>
            <Link className="hover:text-tertiary transition-colors" href={listHref}>
              {propertiesLabel}
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">{property.location}</span>
          </nav>

          <div className="flex items-start justify-between gap-3 md:gap-4 mb-2">
            <h1 className="text-[28px] leading-[1.15] md:text-[36px] md:leading-tight lg:text-[40px] font-headline-lg text-primary flex-1 min-w-0">
              {property.title}
            </h1>
            <PropertyDetailFavoriteButton propertyId={property.id} size="responsive" />
          </div>

          {locationSubtitle && (
            <div className="flex items-center gap-2 mb-3 md:mb-2">
              <MapPin className="text-tertiary shrink-0 w-[18px] h-[18px] md:w-6 md:h-6" />
              <span className="text-[16px] leading-snug md:text-headline-sm md:leading-normal font-headline-sm text-on-surface-variant italic opacity-90">
                {locationSubtitle}
              </span>
            </div>
          )}

          {property.price && (
            <div className="text-[26px] md:text-[30px] lg:text-[32px] font-semibold font-headline-md text-tertiary mb-6 md:mb-10">
              {property.price}
            </div>
          )}

          {renderDescription(property.description)}

          <PropertyDetailFooterActions brochureUrl={brochureUrl} />
        </div>
      </section>

      <PropertyDetailSpecs items={specItems} />

      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-3 gap-24 mb-24">
        <div className="lg:col-span-2">
          <PropertyDetailAmenities amenities={amenities} />
          <PropertyDetailEnergy energy={energy ?? { isEmpty: true }} />
        </div>

        <div className="lg:col-span-1" id="property-inquiry">
          <PropertyDetailInquiryForm
            contactForm={contactForm}
            inquiry={inquiry}
            propertyTitle={property.title}
          />
        </div>
      </section>

      {/* video section */}
      {videos.length > 0 && <PropertyDetailVideo videos={videos} propertyTitle={property.title} />}

      {latitude != null && longitude != null && (
        <PropertyDetailMap
          latitude={latitude}
          longitude={longitude}
          title={property.title}
          locationLabel={locationSubtitle || property.location}
          description={property.reference ? `${refPrefixLabel} ${property.reference}` : undefined}
        />
      )}

      <PropertyDetailRelated
        properties={relatedProperties}
        loading={similarPropertiesLoading}
        showSoldBadge={showSimilarSoldBadge}
      />
    </main>
  )
}
