'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { useTranslation } from '@/utilities/translateClient'

type Props = Extract<Page['layout'][0], { blockType: 'missionBlock' }>

export const MissionBlock: React.FC<Props> = ({
  subtitle,
  title,
  content,
  buttonText,
  ctaLink,
  image,
  establishedYear,
}) => {
  const ref = useReveal()

  const establishedYearLabel = useTranslation('missionBlock.establishedYearLabel', 'Established')

  return (
    <section ref={ref} className="py-16 md:py-24 bg-surface-container-low overflow-hidden">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-gutter">
        <div className="md:col-span-7 reveal">
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            {typeof image === 'object' && image !== null && (
              <Media resource={image} imgClassName="w-full aspect-[4/3] object-cover" />
            )}
            {establishedYear && (
              <div className="absolute bottom-0 left-0 bg-tertiary px-6 py-5 md:px-10 md:py-8 text-white">
                <span className="font-headline-md md:font-display-lg text-headline-md md:text-headline-lg block leading-none">
                  {establishedYear}
                </span>
                <span className="font-label-sm text-label-sm tracking-widest mt-1 block uppercase">{establishedYearLabel}</span>
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-5 flex flex-col gap-4 md:gap-6 reveal delay-200">
          {subtitle && (
            <span className="text-tertiary font-label-nav text-label-nav tracking-[0.3em] uppercase">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary leading-tight">
            {title}
          </h2>
          <p className="font-body-lg text-body-lg text-secondary leading-relaxed">
            {content}
          </p>
          {ctaLink && (
            <div className="flex gap-8 mt-4">
              <CMSLink
                {...ctaLink}
                label={buttonText || ctaLink.label || undefined}
                appearance="inline"
                className="font-label-nav text-label-nav text-primary border-b border-primary pb-1 hover:text-tertiary hover:border-tertiary transition-all"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
