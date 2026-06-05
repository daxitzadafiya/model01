import React from 'react'

import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'

type SpecItem = {
  icon: string
  label: string
  value: string
}

type Props = {
  items: SpecItem[]
}

export const PropertyDetailSpecs: React.FC<Props> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <section className="bg-surface-sand py-12 mb-24">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center space-x-4 ${
                index < items.length - 1 ? 'md:border-r md:border-outline-variant/30' : ''
              }`}
            >
              <PropertyDetailIcon name={item.icon} className="text-accent-gold shrink-0" size={28} />
              <div>
                <div className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                  {item.label}
                </div>
                <div className="text-headline-sm font-headline-sm text-primary">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
