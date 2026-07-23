'use client'

import React from 'react'

import { ProjectsCarousel } from '@/components/ProjectsCarousel'
import type { NormalizedCRMProject } from '@/utilities/crmProjects'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  projects: NormalizedCRMProject[]
  loading?: boolean
}

export const ProjectDetailRelated: React.FC<Props> = ({ projects, loading = false }) => {
  const subtitle = useTranslation('projectDetail.similar.subtitle', 'Curated Collection')
  const title = useTranslation('projectDetail.similar.heading', 'Similar Projects')

  if (!loading && projects.length === 0) return null

  return (
    <ProjectsCarousel
      subtitle={subtitle}
      title={title}
      projects={projects}
      loading={loading}
      backgroundColor="surface"
      animateEntry
      emptyEyebrow="Projects"
      emptyTitle="No projects found"
      emptyDescription="We could not find similar projects right now. Check again soon."
    />
  )
}
