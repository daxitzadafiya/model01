'use client'

import Link from 'next/link'
import React from 'react'
import type { Page } from '@/payload-types'
import { getCMSLinkHref } from '@/components/Link/getCMSLinkHref'
import { Media } from '@/components/Media'
import { isLocale, type Locale } from '@/i18n/config'
import { cn } from '@/utilities/ui'
import { useReveal } from '@/utilities/useReveal'
import { useSiteLocale } from '@/utilities/useSiteLocale'

type Props = Extract<Page['layout'][0], { blockType: 'virtualTourBlock' }>

const ctaClassName = cn(
  'inline-flex items-center justify-center px-10 py-4 rounded-full no-underline',
  'bg-tertiary font-label-nav text-label-nav uppercase tracking-widest',
  'text-on-tertiary hover:text-on-tertiary hover:bg-tertiary-container',
  'transition-all shadow-xl active:scale-95',
)

export const VirtualTourBlock: React.FC<Props> = ({
  title,
  buttonText,
  ctaLink,
  backgroundImage,
}) => {
  const ref = useReveal()
  const siteLocale = useSiteLocale()
  const locale: Locale = isLocale(siteLocale) ? siteLocale : 'en'
  const href = getCMSLinkHref(ctaLink, locale)
  const label = buttonText || ctaLink?.label || 'EXPLORE NOW'
  const newTabProps = ctaLink?.newTab
    ? { rel: 'noopener noreferrer' as const, target: '_blank' as const }
    : {}

  return (
    <section ref={ref} className="relative min-h-[420px] md:min-h-[520px] overflow-hidden reveal">
      {typeof backgroundImage === 'object' && backgroundImage !== null && (
        <div className="absolute inset-0">
          <Media resource={backgroundImage} fill priority imgClassName="object-cover" />
        </div>
      )}
      <div className="absolute inset-0 bg-primary/50 z-10" />
      <div className="relative z-20 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 md:py-28 flex flex-col items-center justify-center text-center text-white min-h-[420px] md:min-h-[520px]">
        <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg max-w-3xl mb-8 leading-tight">
          {title}
        </h2>
        {href && (
          <Link href={href} className={ctaClassName} {...newTabProps}>
            {label}
          </Link>
        )}
      </div>
    </section>
  )
}
