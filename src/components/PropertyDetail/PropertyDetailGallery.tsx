'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  title: string
  badgeLabel?: string
}

const TRANSITION_MS = 600
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const THUMBNAILS_VISIBLE = 5
const THUMB_GAP_PX = 12

const transitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

const getAdjacentIndices = (index: number, total: number) => {
  if (total <= 1) return [index]
  return [index, (index + 1) % total, (index - 1 + total) % total]
}

const preloadImageUrl = (url: string) => {
  const image = new window.Image()
  image.src = url
}

const getThumbStripOffset = ({
  activeIndex,
  total,
  thumbWidth,
  viewportWidth,
}: {
  activeIndex: number
  total: number
  thumbWidth: number
  viewportWidth: number
}) => {
  if (total <= THUMBNAILS_VISIBLE || thumbWidth <= 0 || viewportWidth <= 0) return 0

  const thumbStride = thumbWidth + THUMB_GAP_PX
  const trackWidth = total * thumbWidth + (total - 1) * THUMB_GAP_PX
  const offsetBefore = activeIndex * thumbStride
  const activeCenter = offsetBefore + thumbWidth / 2
  const idealOffset = activeCenter - viewportWidth / 2

  return Math.max(0, Math.min(idealOffset, trackWidth - viewportWidth))
}

export const PropertyDetailGallery: React.FC<Props> = ({ images, title, badgeLabel }) => {
  const slides = useMemo(
    () => (images.length > 0 ? images : ['/placeholder-property.png']),
    [images],
  )

  const thumbViewportRef = useRef<HTMLDivElement>(null)
  const [thumbWidth, setThumbWidth] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)

  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loadedSlideIndices, setLoadedSlideIndices] = useState<Set<number>>(() => new Set([0]))

  const hasMultiple = slides.length > 1
  const slideCount = slides.length
  const needsThumbSlider = slideCount > THUMBNAILS_VISIBLE

  const thumbStripOffset = useMemo(
    () =>
      getThumbStripOffset({
        activeIndex,
        total: slideCount,
        thumbWidth,
        viewportWidth,
      }),
    [activeIndex, slideCount, thumbWidth, viewportWidth],
  )

  useEffect(() => {
    const element = thumbViewportRef.current
    if (!element) return

    const updateMeasurements = () => {
      const measuredViewport = element.clientWidth
      const measuredThumb =
        (measuredViewport - THUMB_GAP_PX * (THUMBNAILS_VISIBLE - 1)) / THUMBNAILS_VISIBLE

      setViewportWidth(measuredViewport)
      setThumbWidth(Math.max(0, measuredThumb))
    }

    updateMeasurements()

    const observer = new ResizeObserver(updateMeasurements)
    observer.observe(element)
    return () => observer.disconnect()
  }, [slideCount])

  useEffect(() => {
    setActiveIndex(0)
    setIsTransitioning(false)
    setLoadedSlideIndices(new Set([0]))
  }, [slides])

  const ensureSlidesLoaded = useCallback(
    (indices: number[]) => {
      setLoadedSlideIndices((previous) => {
        let changed = false
        const next = new Set(previous)
        indices.forEach((index) => {
          if (index >= 0 && index < slideCount && !next.has(index)) {
            next.add(index)
            changed = true
          }
        })
        return changed ? next : previous
      })
    },
    [slideCount],
  )

  const prefetchSlideUrls = useCallback(
    (indices: number[]) => {
      indices.forEach((index) => {
        const url = slides[index]
        if (url) preloadImageUrl(url)
      })
    },
    [slides],
  )

  useEffect(() => {
    if (!hasMultiple || activeIndex === 0) return
    const indices = getAdjacentIndices(activeIndex, slideCount)
    ensureSlidesLoaded(indices)
    prefetchSlideUrls(indices)
  }, [activeIndex, ensureSlidesLoaded, hasMultiple, prefetchSlideUrls, slideCount])

  const goTo = useCallback(
    (index: number) => {
      if (!hasMultiple || isTransitioning) return

      const nextIndex = ((index % slideCount) + slideCount) % slideCount
      if (nextIndex === activeIndex) return

      const indices = getAdjacentIndices(nextIndex, slideCount)
      ensureSlidesLoaded(indices)
      prefetchSlideUrls(indices)
      setIsTransitioning(true)
      setActiveIndex(nextIndex)
      window.setTimeout(() => setIsTransitioning(false), TRANSITION_MS)
    },
    [
      activeIndex,
      ensureSlidesLoaded,
      hasMultiple,
      isTransitioning,
      prefetchSlideUrls,
      slideCount,
    ],
  )

  const mainTranslateX = `translateX(-${activeIndex * 100}%)`

  return (
    <div className="space-y-6">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-xl bg-surface-container-high">
        {hasMultiple ? (
          <div
            className="flex h-full w-full transition-transform ease-in-out"
            style={{
              transform: mainTranslateX,
              ...transitionStyle,
            }}
          >
            {slides.map((src, index) => (
              <div key={`${src}-${index}`} className="relative h-full w-full shrink-0">
                {loadedSlideIndices.has(index) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`${title} — image ${index + 1} of ${slides.length}`}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 && activeIndex === 0 ? 'high' : 'low'}
                  />
                ) : (
                  <div className="h-full w-full bg-surface-container-high animate-pulse" aria-hidden />
                )}
              </div>
            ))}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={title}
            className="w-full h-full object-cover"
            src={slides[0]}
            loading="eager"
            decoding="async"
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              disabled={isTransitioning}
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer disabled:opacity-60"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              disabled={isTransitioning}
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer disabled:opacity-60"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {badgeLabel && (
          <div className="absolute bottom-4 left-4 z-20">
            <span className="bg-primary/80 backdrop-blur-sm text-white px-3 py-1 text-label-sm font-label-sm rounded uppercase">
              {badgeLabel}
            </span>
          </div>
        )}
      </div>

      {hasMultiple && (
        <div ref={thumbViewportRef} className="overflow-hidden" aria-label="Property image thumbnails">
          <div
            className={`flex gap-3 ease-in-out ${
              needsThumbSlider ? 'transition-transform' : ''
            }`}
            style={
              needsThumbSlider
                ? {
                    transform: `translateX(-${thumbStripOffset}px)`,
                    ...transitionStyle,
                  }
                : undefined
            }
          >
            {slides.map((src, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${slides.length}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => goTo(index)}
                  className={`aspect-square rounded cursor-pointer p-0 box-border border-[3px] ease-in-out transition-all ${
                    needsThumbSlider ? '' : 'min-w-0 flex-1'
                  } ${
                    isActive
                      ? 'border-tertiary opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    ...(needsThumbSlider && thumbWidth > 0
                      ? { width: thumbWidth, flexShrink: 0 }
                      : {}),
                    ...transitionStyle,
                  }}
                >
                  <span className="block h-full w-full overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className="h-full w-full object-cover" src={src} loading="lazy" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
