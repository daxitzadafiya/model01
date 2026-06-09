'use client'

import React, { Suspense } from 'react'
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
  showMap,
  forceSoldBadge,
  emptyStateNoFavoritesTitle,
  emptyStateNoFavoritesDescription,
  emptyStateNoResultsTitle,
  emptyStateNoResultsDescription,
}) => {
  const preset = (listingPreset ?? 'forSale') as CRMListingPreset

  return (
    <section className="bg-surface pt-24 pb-12 md:pt-28 md:pb-16">
      {(showBreadcrumb !== false || pageTitle) && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-12">
          {showBreadcrumb !== false && (
            <nav
              className="flex items-center gap-2 text-secondary font-label-sm text-label-sm mb-4 uppercase tracking-widest"
              aria-label="Breadcrumb"
            >
              <Link
                href={breadcrumbParentHref || '/'}
                className="text-tertiary hover:text-primary transition-colors"
              >
                {breadcrumbParentLabel || 'Home'}
              </Link>
              <ChevronRight size={14} className="shrink-0 text-on-surface-variant" aria-hidden />
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

      <Suspense fallback={null}>
        <PropertyListView
          listingPreset={preset}
          crmQueryJson={crmQueryJson}
          pageSize={pageSize}
          showFilters={showFilters}
          showMap={showMap}
          forceSoldBadge={forceSoldBadge}
          resultsLabel={resultsLabel}
          emptyStateNoFavoritesTitle={emptyStateNoFavoritesTitle}
          emptyStateNoFavoritesDescription={emptyStateNoFavoritesDescription}
          emptyStateNoResultsTitle={emptyStateNoResultsTitle}
          emptyStateNoResultsDescription={emptyStateNoResultsDescription}
        />
      </Suspense>
    </section>
  )
}
