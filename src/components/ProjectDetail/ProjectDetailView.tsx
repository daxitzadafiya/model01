'use client'

import Link from 'next/link'
import React from 'react'
import { Clock, KeyRound, MapPin } from 'lucide-react'

import {
  PropertyDetailFavoriteButton,
  PropertyDetailFooterActions,
} from '@/components/PropertyDetail/PropertyDetailActions'
import { PropertyDetailAmenities } from '@/components/PropertyDetail/PropertyDetailAmenities'
import { PropertyDetailGallery } from '@/components/PropertyDetail/PropertyDetailGallery'
import { PropertyDetailInquiryForm } from '@/components/PropertyDetail/PropertyDetailInquiryForm'
import { PropertyDetailMap } from '@/components/PropertyDetail/PropertyDetailMap'
import { PropertyDetailSpecs } from '@/components/PropertyDetail/PropertyDetailSpecs'
import { PropertyDetailVideo } from '@/components/PropertyDetail/PropertyDetailVideo'
import { ProjectDetailAvailability } from '@/components/ProjectDetail/ProjectDetailAvailability'
import { ProjectDetailDocuments } from '@/components/ProjectDetail/ProjectDetailDocuments'
import { ProjectDetailRelated } from '@/components/ProjectDetail/ProjectDetailRelated'
import type { CRMAmenity } from '@/utilities/crmAmenities'
import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import type { Form } from '@/payload-types'
import type { NormalizedCRMProject } from '@/utilities/crmProjects'
import type { PropertyInquiryContext } from '@/utilities/propertyInquiry'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  project: NormalizedCRMProject
  amenities: CRMAmenity[]
  videos?: CRMPropertyVideoItem[]
  documents?: CRMPropertyDocumentGroup[]
  latitude?: number
  longitude?: number
  portfolioHref?: string
  relatedProjects?: NormalizedCRMProject[]
  similarProjectsLoading?: boolean
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

export const ProjectDetailView: React.FC<Props> = ({
  contactForm,
  inquiry,
  project,
  amenities,
  videos = [],
  documents = [],
  latitude,
  longitude,
  portfolioHref = '/projects',
  relatedProjects = [],
  similarProjectsLoading = false,
}) => {
  const homeLabel = useTranslation('homeLabel', 'Home')
  const projectsLabel = useTranslation('projectDetail.breadcrumb.projects', 'Projects')
  const refPrefixLabel = useTranslation('propertyDetail.map.refPrefix', 'Ref:')
  const keyReadyLabel = useTranslation('projectList.card.keyReady', 'Key ready')
  const deliveryLabel = useTranslation('projectList.card.delivery', 'Delivery')
  const phaseLabel = useTranslation('projectList.card.phase', 'Phase')
  const fromLabel = useTranslation('projectList.card.from', 'From')
  const phasesHeading = useTranslation('projectDetail.phasesHeading', 'Available options')
  const unitsLabel = useTranslation('projectDetail.specs.units', 'Units')
  const priceLabel = useTranslation('propertyDetail.specs.price', 'Price')
  const bedroomsLabel = useTranslation('propertyDetail.specs.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyDetail.specs.bathrooms', 'Bathrooms')
  const livingAreaLabel = useTranslation('propertyDetail.specs.livingArea', 'Living Area')
  const bedroomSingular = useTranslation('propertyDetail.specs.bedroomSingular', 'Bedroom')
  const bedroomPlural = useTranslation('propertyDetail.specs.bedroomPlural', 'Bedrooms')
  const bathSingular = useTranslation('propertyDetail.specs.bathSingular', 'Bath')
  const bathPlural = useTranslation('propertyDetail.specs.bathPlural', 'Baths')

  const locationSubtitle = [project.city, project.location]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')
  const galleryImages = project.imageUrls ?? (project.imageUrl ? [project.imageUrl] : [])
  const totalUnits = project.phases.reduce((sum, phase) => sum + (phase.quantity ?? 0), 0)

  const specItems = [
    project.beds != null
      ? {
          icon: 'bed',
          label: bedroomsLabel,
          value: `${project.beds} ${project.beds === 1 ? bedroomSingular : bedroomPlural}`,
        }
      : null,
    project.baths != null
      ? {
          icon: 'bathtub',
          label: bathroomsLabel,
          value: `${project.baths} ${project.baths === 1 ? bathSingular : bathPlural}`,
        }
      : null,
    project.isKeyReady
      ? { icon: 'check_circle', label: deliveryLabel, value: keyReadyLabel }
      : project.deliveryLabel
        ? { icon: 'check_circle', label: deliveryLabel, value: project.deliveryLabel }
        : null,
    project.price ? { icon: 'check_circle', label: priceLabel, value: project.price } : null,
    totalUnits > 0 ? { icon: 'basement', label: unitsLabel, value: String(totalUnits) } : null,
    project.sqft
      ? { icon: 'straighten', label: livingAreaLabel, value: String(project.sqft) }
      : null,
  ].filter((item): item is { icon: string; label: string; value: string } => Boolean(item))

  return (
    <main className="pt-20 md:pt-24 lg:pt-28 bg-surface-bright text-on-surface">
      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start mb-16 md:mb-24">
        <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-32 lg:self-start">
          <PropertyDetailGallery images={galleryImages} title={project.title} />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full py-2">
          <nav className="flex flex-wrap gap-x-2 text-label-sm font-label-sm text-on-surface-variant uppercase mb-4">
            <Link className="hover:text-tertiary transition-colors" href="/">
              {homeLabel}
            </Link>
            <span>/</span>
            <Link className="hover:text-tertiary transition-colors" href={portfolioHref}>
              {projectsLabel}
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">{project.location}</span>
          </nav>

          <div className="flex items-start justify-between gap-3 md:gap-4 mb-2">
            <h1 className="text-[28px] leading-[1.15] md:text-[36px] md:leading-tight lg:text-[40px] font-headline-lg text-primary flex-1 min-w-0">
              {project.title}
            </h1>
            {project.id && (
              <PropertyDetailFavoriteButton
                propertyId={project.id}
                kind="project"
                size="responsive"
              />
            )}
          </div>

          {locationSubtitle && (
            <div className="flex items-center gap-2 mb-3 md:mb-2">
              <MapPin className="text-tertiary shrink-0 w-[18px] h-[18px] md:w-6 md:h-6" />
              <span className="text-[16px] leading-snug md:text-headline-sm md:leading-normal font-headline-sm text-on-surface-variant italic opacity-90">
                {locationSubtitle}
              </span>
            </div>
          )}

          {project.reference && (
            <p className="font-label-sm text-label-sm text-secondary uppercase mb-3">
              {refPrefixLabel} {project.reference}
            </p>
          )}

          {project.price && (
            <div className="text-[26px] md:text-[30px] lg:text-[32px] font-semibold font-headline-md text-tertiary mb-4">
              {project.price}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 md:mb-8 text-body-md font-body-md text-on-surface-variant">
            {totalUnits > 0 && <span>{totalUnits} units</span>}
            {project.isKeyReady ? (
              <span className="inline-flex items-center gap-1.5">
                <KeyRound size={16} className="text-tertiary" aria-hidden />
                {keyReadyLabel}
              </span>
            ) : project.deliveryLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={16} className="text-tertiary" aria-hidden />
                {deliveryLabel}: {project.deliveryLabel}
              </span>
            ) : null}
          </div>

          {renderDescription(project.description)}

          <PropertyDetailFooterActions />
        </div>
      </section>

      <PropertyDetailSpecs items={specItems} />

      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-16 grid grid-cols-1 gap-12 md:mb-24 md:gap-16 lg:grid-cols-3 lg:gap-24">
        <div className="lg:col-span-2 space-y-12">
          <PropertyDetailAmenities amenities={amenities} />
          <ProjectDetailDocuments groups={documents} />

          {project.availabilityPhases.length === 0 && project.phases.length > 0 ? (
            <div>
              <h2 className="text-headline-lg font-headline-lg text-primary mb-8">
                {phasesHeading}
              </h2>
              <ul className="space-y-4">
                {project.phases.map((phase, index) => (
                  <li
                    key={`${phase.constructionPhase}-${index}`}
                    className="flex items-start justify-between gap-4 border-b border-outline-variant/30 pb-4"
                  >
                    <div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {phaseLabel} {phase.constructionPhase} {fromLabel}{' '}
                        <span className="font-label-md text-label-md text-primary">
                          {phase.priceFromLabel ? `${phase.priceFromLabel} €` : '—'}
                        </span>
                      </p>
                      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                        {[
                          phase.bedrooms != null ? `${phase.bedrooms} rooms` : null,
                          phase.bathrooms != null ? `${phase.bathrooms} baths` : null,
                          phase.built != null ? `${Math.floor(phase.built)}m²` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {phase.quantity != null && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                        (x{phase.quantity})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1" id="property-inquiry">
          <PropertyDetailInquiryForm
            contactForm={contactForm}
            inquiry={inquiry}
            propertyTitle={project.title}
          />
        </div>
      </section>

      {project.availabilityPhases.length > 0 && (
        <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-16 md:mb-24 w-full overflow-x-hidden">
          <ProjectDetailAvailability phases={project.availabilityPhases} />
        </section>
      )}

      {videos.length > 0 && <PropertyDetailVideo videos={videos} propertyTitle={project.title} />}

      {latitude != null && longitude != null && (
        <PropertyDetailMap
          latitude={latitude}
          longitude={longitude}
          title={project.title}
          locationLabel={locationSubtitle || project.location}
          description={project.reference ? `${refPrefixLabel} ${project.reference}` : undefined}
        />
      )}

      <ProjectDetailRelated projects={relatedProjects} loading={similarProjectsLoading} />
    </main>
  )
}
