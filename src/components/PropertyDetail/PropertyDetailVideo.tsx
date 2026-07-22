'use client'

import React from 'react'

import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  videos: CRMPropertyVideoItem[]
  propertyTitle: string
}

const iframeAllowByKind = (kind: CRMPropertyVideoItem['kind']): string => {
  if (kind === 'matterport') {
    return 'fullscreen; vr'
  }

  return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
}

const aspectClassByKind = (kind: CRMPropertyVideoItem['kind']): string => {
  if (kind === 'matterport') {
    return 'aspect-[4/3] md:aspect-video'
  }

  return 'aspect-video'
}

const isDirectVideoFile = (url: string): boolean =>
  /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)

export const PropertyDetailVideo: React.FC<Props> = ({ videos, propertyTitle }) => {
  const tourLabel = useTranslation('propertyDetail.video.tour', 'Tour')
  const videoHeading = useTranslation('propertyDetail.video.heading', 'Video')

  if (videos.length === 0) return null

  return (
    <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-16 md:mb-24">
      <div className="flex w-full flex-col gap-10 md:gap-12">
        {videos.map((video, index) => {
          const title =
            videos.length > 1
              ? video.label === 'Tour'
                ? `360° ${tourLabel}`
                : video.label
              : videoHeading
          const useNativeVideo =
            video.kind === 'file' ||
            (video.kind === 'iframe' && isDirectVideoFile(video.sourceUrl || video.embedUrl))

          return (
            <div key={`${video.kind}-${video.embedUrl}-${index}`} className="w-full">
              <h2 className="mb-5 text-center text-headline-md font-headline-md uppercase tracking-widest text-primary md:mb-6">
                {title}
              </h2>

              {/*
                Keep a true 16:9 (or matterport) box at content width.
                Do not combine full-width + max-height — that flattens the box and causes side black bars.
              */}
              <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl shadow-lg">
                <div
                  className={`relative w-full overflow-hidden bg-surface-container-highest ${aspectClassByKind(video.kind)}`}
                >
                  {useNativeVideo ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                      title={`${video.label} — ${propertyTitle}`}
                      src={video.sourceUrl || video.embedUrl}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <iframe
                      title={`${video.label} — ${propertyTitle}`}
                      src={video.embedUrl}
                      className="absolute inset-0 h-full w-full border-0"
                      allow={iframeAllowByKind(video.kind)}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
