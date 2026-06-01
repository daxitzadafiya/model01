'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'founderSpotlightBlock' }>

export const FounderSpotlightBlock: React.FC<Props> = ({
  subtitle,
  name,
  role,
  quote,
  bio,
  portrait,
  highlights,
}) => {
  const ref = useReveal()

  const bioParagraphs = bio
    ? bio
        .split(/\n\s*\n|\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : []

  const hasHighlights = highlights && highlights.length > 0

  return (
    <section ref={ref} className="relative py-16 md:py-24 bg-surface-container overflow-hidden">
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-tertiary/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-gutter items-center">
          {/* Content */}
          <div className="lg:col-span-7 flex flex-col gap-7 md:gap-9 reveal delay-150">
            <header className="space-y-4">
              {subtitle && (
                <span className="inline-flex items-center gap-3 font-label-nav text-label-nav text-tertiary uppercase tracking-[0.25em] md:tracking-[0.35em]">
                  <span
                    className="h-[2px] w-8 bg-gradient-to-r from-tertiary to-transparent"
                    aria-hidden
                  />
                  {subtitle}
                </span>
              )}

              <div className="space-y-2">
                <h2 className="font-display-lg text-headline-lg md:text-display-lg text-primary leading-[1.12] tracking-tight font-medium">
                  {name}
                </h2>
                {role && (
                  <p className="font-label-nav text-label-nav text-tertiary uppercase tracking-[0.2em] font-semibold">
                    {role}
                  </p>
                )}
              </div>
            </header>

            {quote && (
              <figure className="relative max-w-2xl rounded-xl border border-border bg-surface p-6 md:p-8 shadow-sm">
                <div
                  className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-tertiary md:top-8 md:bottom-8"
                  aria-hidden
                />
                <blockquote className="pl-5 md:pl-6">
                  <p className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-primary italic leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                </blockquote>
              </figure>
            )}

            {bioParagraphs.length > 0 && (
              <div className="flex max-w-2xl flex-col gap-4 md:gap-5">
                {bioParagraphs.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="font-body-lg text-body-lg text-secondary leading-relaxed font-light"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {hasHighlights && (
              <div className="grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center bg-surface px-4 py-6 text-center md:px-5 md:py-7"
                  >
                    <span className="font-display-lg text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-tertiary font-medium">
                      {item.value}
                    </span>
                    <span className="mt-2 font-label-sm text-[10px] md:text-label-sm text-secondary uppercase tracking-wider leading-snug">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portrait */}
          <div className="lg:col-span-5 reveal">
            <div className="group relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-tertiary/15 to-primary/5 opacity-70 blur-md transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)]">
                {typeof portrait === 'object' && portrait !== null && (
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Media
                      resource={portrait}
                      fill
                      priority
                      imgClassName="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                )}
              </div>

              <div
                className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-2xl border border-tertiary/25 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
