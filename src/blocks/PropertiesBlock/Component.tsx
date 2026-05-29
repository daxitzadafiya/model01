'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }>

const CARDS_PER_VIEW_DESKTOP = 3
const CARDS_PER_VIEW_MOBILE = 1
const DESKTOP_MEDIA = '(min-width: 48rem)' // matches --breakpoint-md
const AUTO_PLAY_DELAY = 5000 // 5 seconds
const GAP_PX = 24 // matches gap-6 (1.5rem = 24px)

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(CARDS_PER_VIEW_MOBILE)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const update = () =>
      setCardsPerView(mq.matches ? CARDS_PER_VIEW_DESKTOP : CARDS_PER_VIEW_MOBILE)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return cardsPerView
}

export const PropertiesBlock: React.FC<Props> = ({
  subtitle,
  title,
  backgroundColor,
  properties,
}) => {
  const sectionRef = useReveal()
  const cardsPerView = useCardsPerView()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const bgClass =
    backgroundColor === 'surface-container-low' ? 'bg-surface-container-low' : 'bg-surface'

  const total = properties?.length ?? 0
  const maxIndex = Math.max(0, total - cardsPerView)

  // Keep slide index valid when switching between 1-up (mobile) and 3-up (desktop)
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentIndex(Math.max(0, Math.min(maxIndex, index)))
      setTimeout(() => setIsTransitioning(false), 600)
    },
    [isTransitioning, maxIndex],
  )

  const handlePrev = useCallback(() => {
    goTo(currentIndex <= 0 ? maxIndex : currentIndex - 1)
  }, [currentIndex, maxIndex, goTo])

  const handleNext = useCallback(() => {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1)
  }, [currentIndex, maxIndex, goTo])

  // Auto-play
  useEffect(() => {
    if (isPaused || total <= cardsPerView) return

    autoPlayRef.current = setInterval(() => {
      handleNext()
    }, AUTO_PLAY_DELAY)

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isPaused, handleNext, total, cardsPerView])

  // Size and slide distance must use the viewport (container), not the flex track.
  // Plain % resolves against the track width (all cards), which causes partial 4th-card peeks.
  const cardWidth = `calc((100cqw - ${GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const translateX = `calc(-${currentIndex} * (100cqw + ${GAP_PX}px) / ${cardsPerView})`

  const cardBase =
    backgroundColor === 'surface-container-low'
      ? 'bg-surface rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-500'
      : ''

  const imageWrapperClass =
    backgroundColor === 'surface-container-low'
      ? 'relative overflow-hidden h-[240px] md:h-[300px]'
      : 'relative overflow-hidden rounded-xl h-[280px] md:h-[400px]'

  const cardInfoClass = backgroundColor === 'surface-container-low' ? 'p-4 md:p-6' : 'mt-4 md:mt-6'

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${bgClass}`}>
      {/* Header row */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end reveal">
        <div>
          {subtitle && (
            <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary mt-2">
            {title}
          </h2>
        </div>
        <div className="flex gap-3 md:gap-4 shrink-0">
          <button
            onClick={handlePrev}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Carousel viewport — @container so 100cqw = visible width (exactly N cards, no peek) */}
      <div
        className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform duration-600 ease-in-out"
          style={{
            gap: `${GAP_PX}px`,
            transform: `translateX(${translateX})`,
            transitionDuration: '600ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {properties?.map((property, idx) => (
            <div
              key={idx}
              className={`group cursor-pointer shrink-0 ${cardBase}`}
              style={{ width: cardWidth }}
            >
              <div className={imageWrapperClass}>
                {typeof property.image === 'object' && property.image !== null && (
                  <Media
                    resource={property.image}
                    fill
                    imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                {property.isNewListing && (
                  <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md px-4 py-1 text-white font-label-sm text-label-sm tracking-widest">
                    NEW LISTING
                  </div>
                )}
              </div>
              <div className={cardInfoClass}>
                <p className="font-label-sm text-label-sm text-tertiary uppercase mb-1">
                  {property.location}
                </p>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
                  {property.title}
                </h3>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-4 text-secondary font-label-sm text-label-sm">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">bed</span>
                      {property.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">bathtub</span>
                      {property.baths}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">square_foot</span>
                      {property.sqft}m²
                    </span>
                  </div>
                  <span className="font-body-md text-body-md font-bold text-primary">
                    {property.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
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
