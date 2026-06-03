'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Page } from '@/payload-types'

import { PropertyListView } from '@/components/PropertyList/PropertyListView'
import type { CRMListingPreset } from '@/utilities/crmProperties'

type Props = Extract<Page['layout'][0], { blockType: 'propertyListBlock' }>

export const PropertyListBlock: React.FC<Props> = ({
  showBreadcrumb,
  breadcrumbParentLabel,
  breadcrumbParentHref,
  pageTitle,
  resultsLabel,
  listingPreset,
  crmQueryJson,
  pageSize,
  showFilters,
  mapSearchUrl,
  forceSoldBadge,
}) => {
  const preset = (listingPreset ?? 'forSale') as CRMListingPreset

  return (
    <section className="bg-surface py-12 md:py-16">
      {(showBreadcrumb !== false || pageTitle) && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-12">
          {showBreadcrumb !== false && (
            <nav
              className="flex items-center space-x-2 text-on-surface-variant font-label-sm text-label-sm mb-4 uppercase tracking-widest"
              aria-label="Breadcrumb"
            >
              <Link
                href={breadcrumbParentHref || '/'}
                className="hover:text-tertiary transition-colors"
              >
                {breadcrumbParentLabel || 'Home'}
              </Link>
              <ChevronRight size={14} />
              <span className="text-on-surface">{pageTitle || 'Collections'}</span>
            </nav>
          )}
          {pageTitle && (
            <h1 className="font-headline-lg text-headline-lg md:text-display-lg text-on-surface">
              {pageTitle}
            </h1>
          )}
        </div>
      )}

      <PropertyListView
        listingPreset={preset}
        crmQueryJson={crmQueryJson}
        pageSize={pageSize}
        showFilters={showFilters}
        mapSearchUrl={mapSearchUrl}
        forceSoldBadge={forceSoldBadge}
        resultsLabel={resultsLabel}
      />
    </section>
  )
}
