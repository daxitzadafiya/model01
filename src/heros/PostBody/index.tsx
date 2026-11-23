import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

export const PostBody: React.FC<{
  content: DefaultTypedEditorState
}> = ({ content }) => {
  return (
    <section className="pb-16 md:pb-24 bg-surface-sand">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-3xl">
          <RichText data={content} enableGutter={false} />
        </div>
      </div>
    </section>
  )
}
