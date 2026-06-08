import type { Metadata } from 'next'

import { PropertyDetailPageClient } from '@/components/PropertyDetail/PropertyDetailPageClient'
import { getContactForm } from '@/utilities/getContactForm'

export const metadata: Metadata = {
  title: 'Property Details | Roumpos Real Estate',
}

export default async function PropertyDetailsPage() {
  const contactForm = await getContactForm()

  return <PropertyDetailPageClient contactForm={contactForm} />
}
