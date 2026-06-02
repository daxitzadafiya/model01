'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { CAROUSEL_GAP_PX, useCardsPerView, useCarouselIndex } from '@/utilities/useCarousel'

type Props = Extract<Page['layout'][0], { blockType: 'advisorsBlock' }>

const DESKTOP_CARDS = 3
const MOBILE_CARDS = 1
const AUTO_PLAY_DELAY = 6000

export const AdvisorsBlock: React.FC<Props> = ({ subtitle, title, advisors }) => {
  const sectionRef = useReveal()
  const cardsPerView = useCardsPerView(DESKTOP_CARDS, MOBILE_CARDS)
  const total = advisors?.length ?? 0
  const { currentIndex, maxIndex, goTo, handlePrev, handleNext, cardWidth, translateX } =
    useCarouselIndex(total, cardsPerView)
  const [isPaused, setIsPaused] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPaused || total <= cardsPerView) return
    autoPlayRef.current = setInterval(handleNext, AUTO_PLAY_DELAY)
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isPaused, handleNext, total, cardsPerView])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-surface">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end reveal">
        <div className="text-center sm:text-left w-full sm:w-auto">
          {subtitle && (
            <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary mt-2">
            {title}
          </h2>
        </div>
        {total > cardsPerView && (
          <div className="flex gap-3 md:gap-4 justify-center sm:justify-end shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous advisors"
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next advisors"
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <div
        className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-8 md:pb-12 reveal overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform ease-in-out"
          style={{
            gap: `${CAROUSEL_GAP_PX}px`,
            transform: `translateX(${translateX})`,
            transitionDuration: '600ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {advisors?.map((advisor, idx) => (
            <div key={idx} className="shrink-0 text-center" style={{ width: cardWidth }}>
              <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full overflow-hidden border-4 border-surface-container mb-6 grayscale hover:grayscale-0 transition-all duration-500">
                {typeof advisor.image === 'object' && advisor.image !== null && (
                  <Media resource={advisor.image} fill imgClassName="object-cover" />
                )}
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{advisor.name}</h3>
              {advisor.role && (
                <p className="font-label-nav text-label-nav text-tertiary uppercase tracking-widest mb-3">
                  {advisor.role}
                </p>
              )}
              {advisor.description && (
                <p className="font-body-md text-body-md text-secondary max-w-sm mx-auto leading-relaxed">
                  {advisor.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex ? 'w-8 bg-tertiary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
