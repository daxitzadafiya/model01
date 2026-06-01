'use client'

import React from 'react'
import type { AboutUsHeroBlock as AboutUsHeroBlockType } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = AboutUsHeroBlockType & {
  disableInnerContainer?: boolean
}

const heightClasses: Record<NonNullable<AboutUsHeroBlockType['height']>, string> = {
  compact: 'min-h-[60vh] md:min-h-[60vh]',
  large: 'min-h-[75vh] md:min-h-[85vh]',
  fullscreen: 'min-h-[100dvh] md:min-h-screen',
}

export const AboutUsHeroBlock: React.FC<Props> = ({
  label,
  headline,
  description,
  backgroundImage,
  height = 'large',
}) => {
  const ref = useReveal()

  return (
    <section
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden flex items-center',
        heightClasses[height ?? 'large'],
      )}
    >
      {typeof backgroundImage === 'object' && backgroundImage !== null && (
        <div className="absolute inset-0">
          <Media resource={backgroundImage} fill priority imgClassName="object-cover object-center" />
        </div>
      )}

      <div className="absolute inset-0 about-hero-gradient z-10" aria-hidden />

      <div className="relative z-20 w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24 lg:py-32">
        <div className="max-w-xl lg:max-w-2xl flex flex-col gap-5 md:gap-6 lg:gap-8 reveal">
          {label && (
            <p className="font-body-md text-body-md text-tertiary tracking-wide">{label}</p>
          )}

          {headline && (
            <h1 className="font-display-lg text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.12] tracking-tight text-white font-medium whitespace-pre-line">
              {headline}
            </h1>
          )}

          {description && (
            <p className="font-body-lg text-body-lg text-white/85 leading-relaxed font-light max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
