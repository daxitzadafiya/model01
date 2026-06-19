import clsx from 'clsx'
import React from 'react'

import type { Post } from '@/payload-types'

import { ArticleCard } from '@/components/ArticleCard'
import { postToItem } from '@/blocks/BlogPostsBlock/postToItem'

export type RelatedPostsProps = {
  className?: string
  docs?: Post[]
  readMoreLabel: string
  title: string
}

export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const { className, docs, readMoreLabel, title } = props

  const items = docs?.filter((doc): doc is Post => typeof doc === 'object').map(postToItem) ?? []

  if (items.length === 0) return null

  return (
    <section className={clsx('py-16 md:py-24 bg-surface-sand', className)}>
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <h2 className="font-headline-md text-headline-md text-primary mb-8 md:mb-12">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {items.map((item) => (
            <ArticleCard
              key={item.id}
              image={item.image}
              category={item.category}
              title={item.title}
              subtitle={item.subtitle}
              excerpt={item.excerpt}
              date={item.date}
              dateTime={item.dateTime}
              href={`/posts/${item.slug}`}
              readMoreLabel={readMoreLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
