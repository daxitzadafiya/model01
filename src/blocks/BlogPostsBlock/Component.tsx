import type { BlogPostsBlock as BlogPostsBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { BlogPostsBlockClient } from './Component.client'
import { postToItem } from './postToItem'

export const BlogPostsBlock: React.FC<BlogPostsBlockProps> = async (props) => {
  const {
    subtitle,
    title,
    postsPerPage: postsPerPageFromProps,
    emptyStateEyebrow,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateLink,
  } = props

  const postsPerPage = postsPerPageFromProps || 9

  const payload = await getPayload({ config: configPromise })

  const postsResult = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: postsPerPage,
    page: 1,
    sort: '-publishedAt',
    overrideAccess: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return (
    <BlogPostsBlockClient
      subtitle={subtitle}
      title={title}
      postsPerPage={postsPerPage}
      initialPage={1}
      initialPosts={postsResult.docs.map(postToItem)}
      initialTotalPages={postsResult.totalPages}
      initialTotalDocs={postsResult.totalDocs}
      emptyStateEyebrow={emptyStateEyebrow}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      emptyStateLink={emptyStateLink}
    />
  )
}
