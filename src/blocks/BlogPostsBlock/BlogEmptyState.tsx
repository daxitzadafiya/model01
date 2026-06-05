'use client'

import React from 'react'
import { ArrowRight, Newspaper } from 'lucide-react'
import { cn } from '@/utilities/ui'

import { CMSLink, type CMSLinkType } from '@/components/Link'

type BlogEmptyStateProps = {
  eyebrow?: string
  title?: string
  description?: string
  ctaLink?: CMSLinkType | null
  className?: string
}

const GhostArticleCards = () => (
  <div
    className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-4 md:gap-6 px-6 opacity-[0.45]"
    aria-hidden
  >
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className={cn(
          'w-[28%] max-w-[200px] shrink-0 rounded-xl border border-outline-variant/40 bg-white/80 overflow-hidden shadow-sm',
          index === 1 ? 'scale-100 -translate-y-1' : 'scale-[0.92] opacity-70',
          index === 0 && '-rotate-2',
          index === 2 && 'rotate-2',
        )}
      >
        <div className="aspect-[4/3] bg-gradient-to-b from-surface-container-high/80 to-surface-container-low/40" />
        <div className="space-y-2 p-3 md:p-4">
          <div className="h-1.5 w-1/3 rounded-full bg-tertiary-fixed-dim/50" />
          <div className="h-2.5 w-full rounded-full bg-outline-variant/25" />
          <div className="h-2 w-4/5 rounded-full bg-outline-variant/20" />
          <div className="flex justify-between pt-1">
            <div className="h-1.5 w-1/4 rounded-full bg-outline-variant/20" />
            <div className="h-1.5 w-1/5 rounded-full bg-tertiary-fixed-dim/40" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const BlogEmptyState: React.FC<BlogEmptyStateProps> = ({
  eyebrow = 'No Results',
  title = 'No posts found',
  description = 'There are no articles published yet. Please check back soon for new content.',
  ctaLink,
  className,
}) => {
  const hasCta = ctaLink && (ctaLink.url || ctaLink.reference)

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-outline-variant/50 bg-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--color-tertiary-fixed-dim,#e6c364)_0%,transparent_55%)] opacity-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container/40 to-transparent"
        aria-hidden
      />

      <GhostArticleCards />

      <div className="relative z-10 flex flex-col items-center px-6 py-14 md:py-16 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface/90 text-tertiary shadow-sm backdrop-blur-sm">
          <Newspaper size={26} strokeWidth={1.5} aria-hidden />
        </div>

        <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
          {eyebrow}
        </span>

        <h3 className="mt-3 font-headline-sm text-headline-sm text-primary max-w-lg">{title}</h3>

        <p className="mt-3 max-w-md font-body-md text-body-md text-secondary leading-relaxed">
          {description}
        </p>

        {hasCta && ctaLink && (
          <div className="mt-8">
            <CMSLink
              {...ctaLink}
              appearance="inline"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-8 py-3 font-label-nav text-label-nav uppercase tracking-widest text-white transition-all duration-300 hover:bg-tertiary hover:border-tertiary hover:shadow-md"
            >
              <ArrowRight size={16} aria-hidden />
            </CMSLink>
          </div>
        )}

        <div
          className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-tertiary-container/70 to-transparent"
          aria-hidden
        />
      </div>
    </div>
  )
}
