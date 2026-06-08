'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { ArticleCard } from '@/components/ArticleCard'
import { PageRange } from '@/components/PageRange'
import { PropertyListPagination } from '@/components/PropertyList/PropertyListPagination'
import type { CMSLinkType } from '@/components/Link'
import type { Media as MediaType } from '@/payload-types'
import { activateRevealElements, useReveal } from '@/utilities/useReveal'

import { BlogEmptyState } from './BlogEmptyState'

export type BlogPostItem = {
  id: string
  image?: MediaType | number | null
  category: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  date?: string | null
  dateTime?: string | null
  slug: string
}

type ClientProps = {
  subtitle?: string | null
  title: string
  postsPerPage: number
  initialPage: number
  initialPosts: BlogPostItem[]
  initialTotalPages: number
  initialTotalDocs: number
  emptyStateEyebrow?: string | null
  emptyStateTitle?: string | null
  emptyStateDescription?: string | null
  emptyStateLink?: CMSLinkType | null
}

export const BlogPostsBlockClient: React.FC<ClientProps> = ({
  subtitle,
  title,
  postsPerPage,
  initialPage,
  initialPosts,
  initialTotalPages,
  initialTotalDocs,
  emptyStateEyebrow,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateLink,
}) => {
  const sectionRef = useReveal()
  const resultsRef = useRef<HTMLDivElement>(null)
  const skipInitialFetch = useRef(true)
  const pendingPageScrollRef = useRef(false)

  const [page, setPage] = useState(initialPage)
  const [posts, setPosts] = useState(initialPosts)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalDocs, setTotalDocs] = useState(initialTotalDocs)
  const [loading, setLoading] = useState(false)

  const scrollToPageTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  const fetchPosts = useCallback(
    async (nextPage: number) => {
      setLoading(true)

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(postsPerPage),
        })

        const response = await fetch(`/api/blog-posts?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch posts')

        const data = (await response.json()) as {
          posts: BlogPostItem[]
          totalPages: number
          totalDocs: number
        }

        setPosts(data.posts)
        setTotalPages(data.totalPages)
        setTotalDocs(data.totalDocs)
      } catch (error) {
        console.error('Failed to load blog posts:', error)
      } finally {
        setLoading(false)
      }
    },
    [postsPerPage],
  )

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }

    void fetchPosts(page)
  }, [page, fetchPosts])

  useEffect(() => {
    if (loading) return
    activateRevealElements(resultsRef.current)
  }, [loading, page, posts.length])

  useEffect(() => {
    if (loading || !pendingPageScrollRef.current) return
    pendingPageScrollRef.current = false
    scrollToPageTop()
  }, [loading, page, scrollToPageTop])

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return
    pendingPageScrollRef.current = true
    setPage(nextPage)
    scrollToPageTop()
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-surface">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 text-center reveal">
        {subtitle && (
          <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
            {subtitle}
          </span>
        )}
        <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary mt-2">
          {title}
        </h2>
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 reveal">
        <PageRange
          collection="posts"
          currentPage={page}
          limit={postsPerPage}
          totalDocs={totalDocs}
        />
      </div>

      <div ref={resultsRef}>
        {posts.length > 0 ? (
          <div
            className={`max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop reveal transition-opacity duration-300 ${
              loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {posts.map((post) => (
                <ArticleCard
                  key={post.id}
                  image={post.image}
                  category={post.category}
                  title={post.title}
                  subtitle={post.subtitle}
                  excerpt={post.excerpt}
                  date={post.date}
                  dateTime={post.dateTime}
                  href={`/posts/${post.slug}`}
                  readMoreLabel="Read More"
                />
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop reveal">
              <BlogEmptyState
                eyebrow={emptyStateEyebrow || 'No Results'}
                title={emptyStateTitle || 'No posts found'}
                description={
                  emptyStateDescription ||
                  'There are no articles published yet. Please check back soon for new content.'
                }
                ctaLink={emptyStateLink}
              />
            </div>
          )
        )}
      </div>

      <div
        className={`max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop transition-opacity duration-300 ${
          loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        <PropertyListPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </section>
  )
}
