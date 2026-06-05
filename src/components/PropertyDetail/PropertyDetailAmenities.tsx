import React from 'react'

import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'
import type { CRMAmenity } from '@/utilities/crmAmenities'

type Props = {
  amenities: CRMAmenity[]
}

export const PropertyDetailAmenities: React.FC<Props> = ({ amenities }) => {
  if (amenities.length === 0) return null

  return (
    <div>
      <h2 className="text-headline-lg font-headline-lg text-primary mb-12">Exclusive Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        {amenities.map((amenity) => (
          <div key={amenity.key} className="flex flex-col items-start space-y-4">
            <div className="w-12 h-12 bg-surface-sand rounded-lg flex items-center justify-center flex-shrink-0">
              <PropertyDetailIcon name={amenity.icon} className="text-accent-gold" size={22} />
            </div>
            <h3 className="font-headline-sm text-[14px] leading-tight text-primary uppercase tracking-widest font-bold">
              {amenity.label}
            </h3>
          </div>
        ))}
      </div>
    </div>
  )
}
