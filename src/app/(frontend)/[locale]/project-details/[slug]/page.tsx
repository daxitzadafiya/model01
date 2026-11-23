import type { Metadata } from 'next'

import { ProjectDetailPageClient } from '@/components/ProjectDetail/ProjectDetailPageClient'
import { getContactForm } from '@/utilities/getContactForm'
import { generateProjectDetailMeta } from '@/utilities/generateCRMDetailMeta'

type Args = {
  params: Promise<{
    locale: string
    slug?: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params: paramsPromise,
}: Args): Promise<Metadata> {
  const { locale, slug = '' } = await paramsPromise
  return generateProjectDetailMeta(decodeURIComponent(slug), locale)
}

export default async function ProjectDetailsPage() {
  const contactForm = await getContactForm()

  return <ProjectDetailPageClient contactForm={contactForm} />
}
