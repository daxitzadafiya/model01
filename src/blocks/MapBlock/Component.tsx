import React from 'react'

import type { Page } from '@/payload-types'

type Props = Extract<Page['layout'][0], { blockType: 'mapBlock' }>

export const MapBlock: React.FC<Props> = ({ mapUrl, height, title }) => {
  if (!mapUrl) return null

  return (
    <section>
      <iframe
        allowFullScreen
        className="w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        style={{ height: height ?? 500 }}
        title={title || 'Map'}
      />
    </section>
  )
}
