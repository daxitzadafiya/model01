'use client'

import React from 'react'
import type { AboutUsHeroBlock as AboutUsHeroBlockType } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = AboutUsHeroBlockType & {
  disableInnerContainer?: boolean
}

export const AboutUsHeroBlock: React.FC<Props> = ({
  label,
  headline,
  description,
  backgroundImage,
}) => {
  const ref = useReveal()

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden flex items-center min-h-[40vh] md:min-h-[42vh] pt-12 md:pt-14"
    >
      {typeof backgroundImage === 'object' && backgroundImage !== null && (
        <div className="absolute inset-0">
          <Media resource={backgroundImage} fill priority imgClassName="object-cover object-center" />
        </div>
      )}

      <div className="absolute inset-0 about-hero-gradient z-10" aria-hidden />

      <div className="relative z-20 w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14 lg:py-16">
        <div className="max-w-xl lg:max-w-2xl flex flex-col gap-2 md:gap-4 lg:gap-5 reveal">
          {label && (
            <p className="font-body-md text-body-md text-tertiary tracking-wide">{label}</p>
          )}

          {headline && (
            <h1 className="font-display-lg text-[clamp(1.875rem,4vw,3rem)] leading-[1.15] tracking-tight text-white font-medium whitespace-pre-line">
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
