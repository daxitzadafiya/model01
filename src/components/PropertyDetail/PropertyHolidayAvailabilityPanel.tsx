'use client'

import React from 'react'

import { PropertyHolidayCalendar } from '@/components/PropertyDetail/PropertyHolidayCalendar'
import type { CRMPropertyBooking } from '@/utilities/holidayRentalPricing'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  bookings?: CRMPropertyBooking[]
  arrival?: string
  departure?: string
}

export const PropertyHolidayAvailabilityPanel: React.FC<Props> = ({
  bookings = [],
  arrival = '',
  departure = '',
}) => {
  const heading = useTranslation(
    'propertyDetail.holiday.availabilityPanelHeading',
    'Availability',
  )
  const subtitle = useTranslation(
    'propertyDetail.holiday.availabilityPanelSubtitle',
    'Blocked dates reflect existing enquiries and confirmed stays from the CRM calendar.',
  )

  return (
    <section className="mt-10 border-t border-outline-variant/15 pt-10 md:mt-16 md:pt-16">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-headline-md text-headline-md text-primary">{heading}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>
      </div>

      <PropertyHolidayCalendar
        bookings={bookings}
        arrival={arrival}
        departure={departure}
        interactive={false}
        months={2}
        showLegend
        legendVariant="availability"
        showClear={false}
      />
    </section>
  )
}
