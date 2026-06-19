import { Calendar, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatPublishedDate } from '@/utilities/formatDateTime'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
  authorLabel: string
  datePublishedLabel: string
}> = ({ post, authorLabel, datePublishedLabel }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, subtitle, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  const categoryTitle =
    categories && typeof categories[0] === 'object' && categories[0] !== null
      ? categories[0].title || 'News'
      : null

  const heroMedia =
    heroImage && typeof heroImage !== 'string'
      ? heroImage
      : typeof post.meta?.image === 'object'
        ? post.meta.image
        : null

  return (
    <header className="pt-20 md:pt-24 pb-6 md:pb-8 bg-surface">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        {categoryTitle && (
          <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest">
            {categoryTitle}
          </span>
        )}

        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mt-3 md:mt-4 max-w-4xl">
          {title}
        </h1>

        {subtitle && (
          <p className="font-body-lg text-body-lg text-secondary mt-4 md:mt-5 max-w-3xl leading-relaxed">
            {subtitle.replace(/\s/g, ' ')}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-outline-variant/40">
          {publishedAt && (
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                {datePublishedLabel}
              </span>
              <time
                dateTime={publishedAt}
                className="inline-flex items-center gap-2 font-body-md text-body-md text-primary"
              >
                <Calendar size={16} className="text-tertiary shrink-0" aria-hidden />
                {formatPublishedDate(publishedAt)}
              </time>
            </div>
          )}

          {hasAuthors && (
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                {authorLabel}
              </span>
              <span className="inline-flex items-center gap-2 font-body-md text-body-md text-primary">
                <User size={16} className="text-tertiary shrink-0" aria-hidden />
                {formatAuthors(populatedAuthors)}
              </span>
            </div>
          )}
        </div>

        {heroMedia && (
          <div className="relative mt-8 md:mt-10 aspect-video md:aspect-21/9 rounded-xl overflow-hidden shadow-sm">
            <Media fill priority imgClassName="object-cover" resource={heroMedia} />
          </div>
        )}
      </div>
    </header>
  )
}
