import type { Metadata } from 'next'

import { PropertyDetailPageClient } from '@/components/PropertyDetail/PropertyDetailPageClient'
import { getContactForm } from '@/utilities/getContactForm'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function generateMetadata(): Promise<Metadata> {
  const logo = await getCachedGlobal('logo', 0)()

  return {
    title: formatPageTitle('Property Details', getAppName(logo)),
  }
}

export default async function PropertyDetailsPage() {
  const contactForm = await getContactForm()

  return <PropertyDetailPageClient contactForm={contactForm} />
}
