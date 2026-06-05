import type { Metadata } from 'next'

import { PropertyDetailPageClient } from '@/components/PropertyDetail/PropertyDetailPageClient'

export const metadata: Metadata = {
  title: 'Property Details | Roumpos Real Estate',
}

export default function PropertyDetailsPage() {
  return <PropertyDetailPageClient />
}
