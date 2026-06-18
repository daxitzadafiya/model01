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
    return 'aspect-[4/3] md:aspect-[16/10]'
  }

  return 'aspect-video'
}

export const PropertyDetailVideo: React.FC<Props> = ({ videos, propertyTitle }) => {
  const tourLabel = useTranslation('propertyDetail.video.tour', 'Tour')

  if (videos.length === 0) return null

  return (
    <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-24">
      <div className="flex w-full flex-col gap-12 md:gap-14">
        {videos.map((video, index) => (
          <div key={`${video.kind}-${video.embedUrl}-${index}`}>
            {videos.length > 1 && (
              <h2 className="text-headline-md font-headline-md text-primary mb-4 text-center uppercase tracking-widest">
                {video.label === 'Tour' ? `360° ${tourLabel}` : video.label}
              </h2>
            )}

            <div className="w-full rounded-2xl shadow-lg overflow-hidden">
              <div
                className={`relative max-h-[500px] w-full overflow-hidden bg-primary ${aspectClassByKind(video.kind)}`}
              >
                <iframe
                  title={`${video.label} — ${propertyTitle}`}
                  src={video.embedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  allow={iframeAllowByKind(video.kind)}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
