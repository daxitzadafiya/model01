'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import { Media } from '@/components/Media'
import { useReveal } from '@/utilities/useReveal'
import type { Media as MediaType } from '@/payload-types'

type CertificateItem = {
  title: string
  subtitle?: string | null
  image: string | MediaType
}

type Props = {
  subtitle?: string | null
  title: string
  certificates?: CertificateItem[] | null
}

const CARDS_PER_VIEW_DESKTOP = 3
const CARDS_PER_VIEW_MOBILE = 1
const DESKTOP_MEDIA = '(min-width: 48rem)'
const GAP_PX = 24

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

export const CertificatesBlock: React.FC<Props> = ({ subtitle, title, certificates }) => {
  const sectionRef = useReveal()
  const cardsPerView = useCardsPerView()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const total = certificates?.length ?? 0
  const maxIndex = Math.max(0, total - cardsPerView)

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

  const cardWidth = `calc((100cqw - ${GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const translateX = `calc(-${currentIndex} * (100cqw + ${GAP_PX}px) / ${cardsPerView})`

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-surface">
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
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal overflow-hidden">
        <div
          className="flex transition-transform duration-600 ease-in-out"
          style={{
            gap: `${GAP_PX}px`,
            transform: `translateX(${translateX})`,
            transitionDuration: '600ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {certificates?.map((certificate, idx) => (
            <div
              key={idx}
              className="group shrink-0 bg-surface-container-low rounded-xl overflow-hidden"
              style={{ width: cardWidth }}
            >
              <div className="relative overflow-hidden h-[240px] md:h-[300px]">
                {typeof certificate.image === 'object' && certificate.image !== null && (
                  <Media
                    resource={certificate.image}
                    fill
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              <div className="p-4 md:p-6">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  {certificate.title}
                </h3>
                {certificate.subtitle && (
                  <p className="mt-2 font-body-sm text-body-sm text-secondary">{certificate.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
