import Link from 'next/link'
import React from 'react'

import {
  PropertyCard,
  resolvePropertyCardStatusBadge,
} from '@/components/PropertyCard'
import type { NormalizedListProperty } from '@/utilities/crmProperties'

type Props = {
  properties: NormalizedListProperty[]
  portfolioHref?: string
}

export const PropertyDetailRelated: React.FC<Props> = ({ properties, portfolioHref = '/' }) => {
  if (properties.length === 0) return null

  return (
    <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">
            More from the Collection
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Hand-picked properties matching this architectural ethos.
          </p>
        </div>
        <Link
          href={portfolioHref}
          className="text-label-nav font-label-nav text-accent-gold uppercase font-bold hover:underline underline-offset-8"
        >
          View All Portfolio
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {properties.map((property) => (
          <PropertyCard
            key={property.id ?? property.reference ?? property.title}
            href={property.detailHref}
            propertyId={property.id}
            property={{
              imageUrl: property.imageUrl,
              imageUrls: property.imageUrls,
              location: property.location,
              reference: property.reference,
              title: property.title,
              beds: property.beds,
              baths: property.baths,
              sqft: property.sqft,
              price: property.price,
              statusBadgeLabel: property.statusBadgeLabel,
            }}
            statusBadgeLabel={resolvePropertyCardStatusBadge({
              statusBadgeLabel: property.statusBadgeLabel,
              useCrmStatus: true,
            })}
            variant="surface"
          />
        ))}
      </div>
    </section>
  )
}
