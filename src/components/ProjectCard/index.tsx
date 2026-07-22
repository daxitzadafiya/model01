'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bath, Bed, Clock, Heart, KeyRound, Plane, Ruler, Waves } from 'lucide-react'

import { PropertyCardImageGallery } from '@/components/PropertyCard/PropertyCardImageGallery'
import { formatPropertyAreaDisplay } from '@/components/PropertyCard'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'
import type { NormalizedCRMProject, ProjectPhaseInfo } from '@/utilities/crmProjects'
import { useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'

type Props = {
  project: NormalizedCRMProject
  projectId?: FavoritePropertyId | null
  href?: string
  className?: string
  style?: React.CSSProperties
}

function PhaseSpecs({ phase }: { phase: ProjectPhaseInfo }) {
  const hasBeds = phase.bedrooms != null && phase.bedrooms > 0
  const hasBaths = phase.bathrooms != null && phase.bathrooms > 0
  const hasBuilt = phase.built != null && phase.built > 0

  if (!hasBeds && !hasBaths && !hasBuilt) return null

  return (
    <div className="flex gap-4 text-secondary font-label-sm text-label-sm">
      {hasBeds && (
        <span className="flex items-center gap-1">
          <Bed size={16} aria-hidden />
          {phase.bedrooms}
          <span className="sr-only"> bedrooms</span>
        </span>
      )}
      {hasBaths && (
        <span className="flex items-center gap-1">
          <Bath size={16} aria-hidden />
          {phase.bathrooms}
          <span className="sr-only"> bathrooms</span>
        </span>
      )}
      {hasBuilt && (
        <span className="flex items-center gap-1">
          <Ruler size={16} aria-hidden />
          {Math.floor(phase.built!)}m²
        </span>
      )}
    </div>
  )
}

function PhaseRow({
  phase,
  phaseLabel,
  fromLabel,
}: {
  phase: ProjectPhaseInfo
  phaseLabel: string
  fromLabel: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-body-sm text-body-sm text-on-surface">
          {phaseLabel} {phase.constructionPhase} {fromLabel}{' '}
          {phase.priceFromLabel ? (
            <span className="font-body-md text-body-md font-bold text-primary">
              {phase.priceFromLabel} €
            </span>
          ) : (
            <span className="text-on-surface-variant">—</span>
          )}
        </p>
        {phase.quantity != null && (
          <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
            (x{phase.quantity})
          </span>
        )}
      </div>
      <PhaseSpecs phase={phase} />
    </div>
  )
}

export const ProjectCard: React.FC<Props> = ({
  project,
  projectId,
  href,
  className = '',
  style,
}) => {
  const { isFavorite, toggleFavorite } = usePropertyFavorites()
  const favorited = projectId != null && projectId !== '' && isFavorite(projectId)
  const [showAllPhases, setShowAllPhases] = useState(false)

  const viewProjectLabel = useTranslation('projectList.card.viewProject', 'View Project')
  const refPrefixLabel = useTranslation('propertyList.card.refPrefix', 'Ref:')
  const addToFavoritesLabel = useTranslation('propertyList.card.addToFavorites', 'Add to favorites')
  const removeFromFavoritesLabel = useTranslation(
    'propertyList.card.removeFromFavorites',
    'Remove from favorites',
  )
  const phaseLabel = useTranslation('projectList.card.phase', 'Phase')
  const fromLabel = useTranslation('projectList.card.from', 'From')
  const seeAllOptionsLabel = useTranslation('projectList.card.seeAllOptions', 'See all options')
  const keyReadyLabel = useTranslation('projectList.card.keyReady', 'Key ready')
  const deliveryLabel = useTranslation('projectList.card.delivery', 'Delivery')
  const airportLabel = useTranslation('projectList.card.airport', 'Airport')
  const beachLabel = useTranslation('projectList.card.beach', 'Beach')

  const visiblePhases = showAllPhases ? project.phases : project.phases.slice(0, 2)
  const hiddenPhaseCount = Math.max(0, project.phases.length - 2)

  const handleFavoritePointer = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleFavoritePointer(event)
    if (projectId == null || projectId === '') return
    toggleFavorite(projectId)
  }

  const cardInfo = (
    <div className="mt-4 md:mt-2 flex flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2">
          {project.title}
        </h3>
        {project.reference && (
          <span className="font-label-sm text-label-sm text-secondary uppercase whitespace-nowrap shrink-0">
            {refPrefixLabel} {project.reference}
          </span>
        )}
      </div>

      {(project.airportDistance || project.beachDistance) && (
        <div className="flex flex-wrap items-center gap-3 text-secondary font-label-sm text-label-sm">
          {project.airportDistance && (
            <span
              className="inline-flex items-center gap-1.5"
              title={`${airportLabel}: ${project.airportDistance}`}
            >
              <Plane size={16} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">{airportLabel} </span>
              {project.airportDistance}
            </span>
          )}
          {project.airportDistance && project.beachDistance && (
            <span className="h-3.5 w-px bg-outline-variant" aria-hidden />
          )}
          {project.beachDistance && (
            <span
              className="inline-flex items-center gap-1.5"
              title={`${beachLabel}: ${project.beachDistance}`}
            >
              <Waves size={16} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">{beachLabel} </span>
              {project.beachDistance}
            </span>
          )}
        </div>
      )}

      {visiblePhases.length > 0 ? (
        <div className="space-y-2.5">
          {visiblePhases.map((phase, index) => (
            <PhaseRow
              key={`${phase.constructionPhase}-${index}`}
              phase={phase}
              phaseLabel={phaseLabel}
              fromLabel={fromLabel}
            />
          ))}
          {hiddenPhaseCount > 0 && !showAllPhases && (
            <button
              type="button"
              className="font-label-sm text-label-sm text-tertiary hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowAllPhases(true)
              }}
            >
              {seeAllOptionsLabel} (+{hiddenPhaseCount})
            </button>
          )}
        </div>
      ) : (
        <div className="flex justify-between items-center gap-3">
          <div className="flex gap-4 text-secondary font-label-sm text-label-sm">
            {project.beds != null && project.beds > 0 && (
              <span className="flex items-center gap-1">
                <Bed size={16} aria-hidden />
                {project.beds}
              </span>
            )}
            {project.baths != null && project.baths > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={16} aria-hidden />
                {project.baths}
              </span>
            )}
            {project.sqft && (
              <span className="flex items-center gap-1">
                <Ruler size={16} aria-hidden />
                {formatPropertyAreaDisplay(project.sqft)}
              </span>
            )}
          </div>
          <span className="font-body-md text-body-md font-bold text-primary text-right">
            {project.price}
          </span>
        </div>
      )}

      <div className="mt-auto space-y-3 pt-1">
        {(project.isKeyReady || project.deliveryLabel) && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-low/70 px-3 py-2.5">
            {project.isKeyReady ? (
              <>
                <KeyRound
                  size={16}
                  strokeWidth={1.75}
                  className="shrink-0 text-tertiary"
                  aria-hidden
                />
                <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface">
                  {keyReadyLabel}
                </span>
              </>
            ) : (
              <>
                <Clock
                  size={16}
                  strokeWidth={1.75}
                  className="shrink-0 text-tertiary"
                  aria-hidden
                />
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {deliveryLabel}
                </span>
                <span className="font-label-sm text-label-sm font-medium text-on-surface">
                  {project.deliveryLabel}
                </span>
              </>
            )}
          </div>
        )}

        {href ? (
          <span className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface py-3 font-label-nav text-label-nav text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-md transition-all duration-300">
            {viewProjectLabel}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </span>
        ) : null}
      </div>
    </div>
  )

  const media = (
    <div className="relative overflow-hidden rounded-xl h-[280px] md:h-[360px] shrink-0">
      <PropertyCardImageGallery
        title={project.title}
        imageUrls={project.imageUrls}
        imageUrl={project.imageUrl}
        href={href}
      />
      {projectId != null && projectId !== '' && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          onMouseDown={handleFavoritePointer}
          onPointerDown={handleFavoritePointer}
          aria-label={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
          aria-pressed={favorited}
          className="absolute top-4 left-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55"
        >
          <Heart
            size={20}
            className={favorited ? 'fill-current text-tertiary-container' : 'fill-none'}
          />
        </button>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className={cn('group flex h-full flex-col', className)} style={style}>
        {media}
        {cardInfo}
      </Link>
    )
  }

  return (
    <article className={cn('group flex h-full flex-col', className)} style={style}>
      {media}
      {cardInfo}
    </article>
  )
}
