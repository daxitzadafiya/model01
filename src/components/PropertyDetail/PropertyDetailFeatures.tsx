'use client'

import {
  Building2,
  Flag,
  MapPin,
  Plane,
  ShoppingCart,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import React, { useMemo } from 'react'

import type { CRMFeatureGroup, CRMFeatureValue, CRMPropertyFeatures } from '@/utilities/crmPropertyFeatures'
import { hasCRMPropertyFeatures } from '@/utilities/crmPropertyFeatures'
import { useTranslatedFeatureValues, useTranslation } from '@/utilities/translateClient'

type Props = {
  features: CRMPropertyFeatures
}

const GROUP_LABEL_FALLBACKS: Record<string, string> = {
  setting: 'Setting',
  orientation: 'Orientation',
  views: 'Views',
  distances: 'Distances',
  baths: 'Baths',
  categories: 'Categories',
  kitchen: 'Kitchen',
  utilities: 'Utilities',
  security: 'Security',
  climateControl: 'Climate Control',
  parking: 'Parking',
  furniture: 'Furniture',
  pool: 'Pool',
  garden: 'Garden',
  features: 'Building Features',
}

const DISTANCE_ICONS: Record<string, LucideIcon> = {
  airport: Plane,
  beach: Waves,
  golf: Flag,
  centre: Building2,
  center: Building2,
  restaurant: UtensilsCrossed,
  sea: Waves,
  supermarket: ShoppingCart,
  town: Building2,
}

const distanceIconFor = (key: string): LucideIcon => {
  const normalized = key.trim().toLowerCase()
  return DISTANCE_ICONS[normalized] ?? MapPin
}

const formatFeatureDisplay = (value: CRMFeatureValue): string => {
  if (value.detail) return `${value.label}: ${value.detail}`
  return value.label
}

const FeatureChips: React.FC<{ values: CRMFeatureValue[] }> = ({ values }) => {
  const translated = useTranslatedFeatureValues(values)

  return (
    <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
      {translated.map((value) => (
        <li
          key={`${value.key}-${value.label}`}
          className="inline-flex max-w-full items-center rounded-full bg-surface-sand px-3.5 py-2 font-body-md text-[13px] leading-snug text-primary"
        >
          <span className="break-words [overflow-wrap:anywhere]">{formatFeatureDisplay(value)}</span>
        </li>
      ))}
    </ul>
  )
}

const DistanceGrid: React.FC<{ values: CRMFeatureValue[] }> = ({ values }) => {
  const translated = useTranslatedFeatureValues(values)

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {translated.map((value) => {
        const Icon = distanceIconFor(value.key)
        return (
          <li
            key={`${value.key}-${value.detail ?? value.label}`}
            className="flex items-center gap-3 rounded-xl bg-surface-sand/90 px-3.5 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-cream text-secondary">
              <Icon size={16} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-label-nav text-[10px] uppercase tracking-[0.16em] text-on-surface/70 font-semibold">
                {value.label}
              </span>
              <span className="mt-0.5 block font-headline-sm text-[15px] font-light leading-snug text-primary">
                {value.detail || value.label}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const FeatureGroupBlock: React.FC<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => (
  <div>
    <h3 className="mb-4 m-0 font-label-nav text-[11px] uppercase tracking-[0.2em] text-on-surface/70 font-bold">
      {label}
    </h3>
    <div>{children}</div>
  </div>
)

const FeatureGroupContent: React.FC<{ group: CRMFeatureGroup }> = ({ group }) => {
  if (group.key === 'distances') return <DistanceGrid values={group.values} />
  return <FeatureChips values={group.values} />
}

export const PropertyDetailFeatures: React.FC<Props> = ({ features }) => {
  const heading = useTranslation('propertyDetail.features.heading', 'Features')
  const licenseLabel = useTranslation(
    'propertyDetail.features.licenseNumber',
    'License number',
  )

  const settingLabel = useTranslation('propertyDetail.features.setting', 'Setting')
  const orientationLabel = useTranslation('propertyDetail.features.orientation', 'Orientation')
  const viewsLabel = useTranslation('propertyDetail.features.views', 'Views')
  const distancesLabel = useTranslation('propertyDetail.features.distances', 'Distances')
  const bathsLabel = useTranslation('propertyDetail.features.baths', 'Baths')
  const categoriesLabel = useTranslation('propertyDetail.features.categories', 'Categories')
  const kitchenLabel = useTranslation('propertyDetail.features.kitchen', 'Kitchen')
  const utilitiesLabel = useTranslation('propertyDetail.features.utilities', 'Utilities')
  const securityLabel = useTranslation('propertyDetail.features.security', 'Security')
  const climateControlLabel = useTranslation(
    'propertyDetail.features.climateControl',
    'Climate Control',
  )
  const parkingLabel = useTranslation('propertyDetail.features.parking', 'Parking')
  const furnitureLabel = useTranslation('propertyDetail.features.furniture', 'Furniture')
  const poolLabel = useTranslation('propertyDetail.features.pool', 'Pool')
  const gardenLabel = useTranslation('propertyDetail.features.garden', 'Garden')
  const buildingFeaturesLabel = useTranslation(
    'propertyDetail.features.buildingFeatures',
    'Building Features',
  )

  const groupLabels = useMemo(
    () => ({
      setting: settingLabel,
      orientation: orientationLabel,
      views: viewsLabel,
      distances: distancesLabel,
      baths: bathsLabel,
      categories: categoriesLabel,
      kitchen: kitchenLabel,
      utilities: utilitiesLabel,
      security: securityLabel,
      climateControl: climateControlLabel,
      parking: parkingLabel,
      furniture: furnitureLabel,
      pool: poolLabel,
      garden: gardenLabel,
      features: buildingFeaturesLabel,
    }),
    [
      settingLabel,
      orientationLabel,
      viewsLabel,
      distancesLabel,
      bathsLabel,
      categoriesLabel,
      kitchenLabel,
      utilitiesLabel,
      securityLabel,
      climateControlLabel,
      parkingLabel,
      furnitureLabel,
      poolLabel,
      gardenLabel,
      buildingFeaturesLabel,
    ],
  )

  if (!hasCRMPropertyFeatures(features)) return null

  return (
    <div className="mb-12 md:mb-16">
      <div className="mb-8 md:mb-10">
        <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
        <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
          {heading}
        </h2>
      </div>

      <div className="space-y-9 md:space-y-10">
        {features.groups.map((group) => (
          <FeatureGroupBlock
            key={group.key}
            label={groupLabels[group.key as keyof typeof groupLabels] || GROUP_LABEL_FALLBACKS[group.key] || group.label}
          >
            <FeatureGroupContent group={group} />
          </FeatureGroupBlock>
        ))}

        {features.licenseNumber ? (
          <div className="rounded-xl bg-surface-sand/90 px-4 py-3.5 md:px-5">
            <p className="mb-2 m-0 font-label-nav text-[10px] uppercase tracking-[0.18em] text-on-surface/70 font-semibold">
              {licenseLabel}
            </p>
            <p className="m-0 break-all [overflow-wrap:anywhere] font-mono text-[12px] leading-relaxed tracking-[0.02em] text-on-surface-variant md:text-[13px]">
              {features.licenseNumber}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
