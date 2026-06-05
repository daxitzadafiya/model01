'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { CMSLink, type CMSLinkType } from '@/components/Link'
import type { Media as MediaType } from '@/payload-types'
import { CAROUSEL_GAP_PX, useCardsPerView, useCarouselIndex } from '@/utilities/useCarousel'

export type KnowledgeArticleItem = {
  id: string
  image?: MediaType | number | null
  category: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  date?: string | null
  dateTime?: string | null
  link: CMSLinkType & { label: string }
}

type ClientProps = {
  subtitle?: string | null
  title: string
  articles: KnowledgeArticleItem[]
  viewAllLink: CMSLinkType
}

const DESKTOP_CARDS = 3
const MOBILE_CARDS = 1

export const KnowledgeBaseBlockClient: React.FC<ClientProps> = ({
  subtitle,
  title,
  articles,
  viewAllLink,
}) => {
  const sectionRef = useReveal()
  const cardsPerView = useCardsPerView(DESKTOP_CARDS, MOBILE_CARDS)
  const total = articles.length
  const { currentIndex, maxIndex, goTo, handlePrev, handleNext, cardWidth, translateX } =
    useCarouselIndex(total, cardsPerView)
  const [isPaused, setIsPaused] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCarousel = cardsPerView < DESKTOP_CARDS

  useEffect(() => {
    if (!isCarousel || isPaused || total <= cardsPerView) return
    autoPlayRef.current = setInterval(handleNext, 6000)
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isCarousel, isPaused, handleNext, total, cardsPerView])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-surface">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 text-center reveal">
        {subtitle && (
          <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
            {subtitle}
          </span>
        )}
        <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary mt-2">
          {title}
        </h2>
      </div>

      {isCarousel && total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous articles"
            className="w-11 h-11 rounded-full border border-outline-variant flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next articles"
            className="w-11 h-11 rounded-full border border-outline-variant flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <div
        className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop overflow-hidden reveal"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={
            isCarousel
              ? 'flex transition-transform ease-in-out'
              : 'grid grid-cols-1 md:grid-cols-3 gap-gutter'
          }
          style={
            isCarousel
              ? {
                  gap: `${CAROUSEL_GAP_PX}px`,
                  transform: `translateX(${translateX})`,
                  transitionDuration: '600ms',
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                }
              : undefined
          }
        >
          {articles.map((article) => (
            <article
              key={article.id}
              className="group shrink-0 flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              style={isCarousel ? { width: cardWidth } : undefined}
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                {typeof article.image === 'object' && article.image !== null && (
                  <Media
                    resource={article.image}
                    fill
                    imgClassName="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              <div className="flex flex-col flex-grow p-6 md:p-8">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-2">
                  {article.category}
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-3 leading-snug">
                  {article.title}
                </h3>
                {(article.subtitle || article.excerpt) && (
                  <p className="font-body-sm text-body-sm text-secondary line-clamp-3">
                    {article.subtitle ?? article.excerpt}
                  </p>
                )}
                <div className="grow min-h-6" />
                <div className="flex items-center justify-between gap-4 pt-4">
                  {article.date && (
                    <time
                      dateTime={article.dateTime ?? undefined}
                      className="inline-flex items-center gap-2 font-label-sm text-label-sm text-secondary shrink-0"
                    >
                      <Calendar size={14} className="text-secondary/70" aria-hidden />
                      {article.date}
                    </time>
                  )}
                  <CMSLink
                    {...article.link}
                    appearance="inline"
                    className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-tertiary hover:text-primary transition-colors ml-auto shrink-0"
                  >
                    <ArrowRight size={14} aria-hidden />
                  </CMSLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {isCarousel && total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to article slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-tertiary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center mt-10 md:mt-12 reveal">
        <CMSLink
          {...viewAllLink}
          appearance="inline"
          className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-8 py-3.5 font-label-nav text-label-nav uppercase tracking-widest text-white transition-all duration-300 hover:bg-tertiary hover:border-tertiary hover:shadow-md"
        >
          <ArrowRight size={16} aria-hidden />
        </CMSLink>
      </div>
    </section>
  )
}
