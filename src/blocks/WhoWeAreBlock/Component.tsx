'use client'

import React from 'react'
import type { WhoWeAreBlock as WhoWeAreBlockType } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { Award, Eye, Heart, Shield, Star, TrendingUp, ArrowRight } from 'lucide-react'

type Props = WhoWeAreBlockType & {
  disableInnerContainer?: boolean
}

const iconMap = {
  star: Star,
  heart: Heart,
  shield: Shield,
  'trending-up': TrendingUp,
  award: Award,
  eye: Eye,
}

export const WhoWeAreBlock: React.FC<Props> = ({
  subtitle,
  title,
  description,
  image,
  pillars,
  buttonText,
  ctaLink,
}) => {
  const ref = useReveal()

  return (
    <section ref={ref} className="relative py-20 md:py-32 bg-surface overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 -right-1/10 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-gutter items-center">
        {/* Featured Image Column */}
        <div className="lg:col-span-6 relative group reveal">
          {/* Subtle visual background accent box */}
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-tertiary/10 to-primary/5 blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]">
            {typeof image === 'object' && image !== null && (
              <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden">
                <Media
                  resource={image}
                  fill
                  priority
                  imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            )}
          </div>
          
          {/* Decorative offset border outline */}
          <div className="absolute inset-0 border border-tertiary/20 rounded-2xl translate-x-4 translate-y-4 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-500" />
        </div>

        {/* Content Column */}
        <div className="lg:col-span-6 flex flex-col gap-6 lg:gap-8 reveal delay-150">
          <div className="space-y-4">
            {subtitle && (
              <span className="inline-flex items-center gap-3 font-label-nav text-label-nav text-tertiary uppercase tracking-[0.25em] md:tracking-[0.35em]">
                <span className="h-[2px] w-8 bg-gradient-to-r from-tertiary to-transparent" aria-hidden />
                {subtitle}
              </span>
            )}
            <h2 className="font-display-lg text-headline-lg md:text-display-lg text-primary leading-[1.15] tracking-tight font-medium">
              {title}
            </h2>
          </div>

          {description && (
            <p className="font-body-lg text-body-lg text-secondary leading-relaxed font-light">
              {description}
            </p>
          )}

          {/* Pillars List */}
          {pillars && pillars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pt-2">
              {pillars.map((pillar, idx) => {
                const Icon = iconMap[pillar.icon || 'star'] || Star
                return (
                  <div
                    key={idx}
                    className="group/pillar flex gap-4 p-4 rounded-xl border border-border bg-surface-container-low transition-all duration-300 hover:bg-white hover:border-tertiary/30 hover:shadow-md"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-tertiary/10 transition-colors duration-300 group-hover/pillar:bg-tertiary/20">
                      <Icon className="w-5 h-5 text-tertiary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline-sm text-lg font-semibold text-primary">
                        {pillar.title}
                      </h3>
                      <p className="font-body-md text-sm text-secondary leading-relaxed font-light">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Call to Action Link */}
          {ctaLink && (
            <div className="pt-2">
              <CMSLink
                {...ctaLink}
                label={null}
                appearance="inline"
                className="group/btn inline-flex w-fit items-center gap-3 rounded-full border border-primary bg-primary px-8 py-4 font-label-nav text-label-nav uppercase tracking-widest text-white font-bold transition-all duration-300 hover:bg-tertiary hover:border-tertiary hover:shadow-[0_8px_20px_-6px_rgba(230,195,100,0.4)]"
              >
                <span>{buttonText || ctaLink.label || 'Learn More'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </CMSLink>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
