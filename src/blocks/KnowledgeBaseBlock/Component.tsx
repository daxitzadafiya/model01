import type { Post, KnowledgeBaseBlock as KnowledgeBaseBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import {
  KnowledgeBaseBlockClient,
  type KnowledgeArticleItem,
} from './Component.client'

export const KnowledgeBaseBlock: React.FC<KnowledgeBaseBlockProps> = async (props) => {
  const { subtitle, title, populateBy, limit: limitFromProps, selectedPosts, articles } = props
  const limit = limitFromProps || 3

  let resolved: KnowledgeArticleItem[] = []

  if (populateBy === 'manual' && articles?.length) {
    resolved = articles.map((article, index) => ({
      id: `manual-${index}`,
      image: article.image,
      category: article.category,
      title: article.title,
      link: {
        type: 'custom' as const,
        url: article.url,
        newTab: article.newTab ?? false,
        label: 'READ MORE',
      },
    }))
  } else if (populateBy === 'selection' && selectedPosts?.length) {
    const posts = selectedPosts
      .map((post) => (typeof post === 'object' ? post : null))
      .filter(Boolean) as Post[]
    resolved = posts.map(postToArticle)
  } else {
    const payload = await getPayload({ config: configPromise })
    const fetched = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      sort: '-publishedAt',
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    resolved = fetched.docs.map(postToArticle)
  }

  if (!resolved.length) return null

  return (
    <KnowledgeBaseBlockClient subtitle={subtitle} title={title} articles={resolved} />
  )
}

function postToArticle(post: Post): KnowledgeArticleItem {
  const category =
    post.categories && typeof post.categories[0] === 'object'
      ? post.categories[0].title
      : post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'News'

  const image =
    (typeof post.meta?.image === 'object' ? post.meta.image : null) ||
    (typeof post.heroImage === 'object' ? post.heroImage : null)

  return {
    id: String(post.id),
    image,
    category: category || 'News',
    title: post.title,
    link: {
      type: 'reference',
      reference: {
        relationTo: 'posts',
        value: post as Post,
      },
      label: 'READ MORE',
    },
  }
}
