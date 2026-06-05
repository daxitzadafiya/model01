'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

import { Media } from '@/components/Media'
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
                <article
                  key={post.id}
                  className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <Link
                    href={`/posts/${post.slug}`}
                    className="relative overflow-hidden aspect-[4/3]"
                  >
                    {typeof post.image === 'object' && post.image !== null && (
                      <Media
                        resource={post.image}
                        fill
                        imgClassName="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                  </Link>
                  <div className="flex flex-col flex-grow p-6 md:p-8">
                    <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-2">
                      {post.category}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-3 leading-snug">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="hover:text-tertiary transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {(post.subtitle || post.excerpt) && (
                      <p className="font-body-sm text-body-sm text-secondary line-clamp-3">
                        {post.subtitle ?? post.excerpt}
                      </p>
                    )}
                    <div className="grow min-h-6" />
                    <div className="flex items-center justify-between gap-4 pt-4">
                      {post.date && (
                        <time
                          dateTime={post.dateTime ?? undefined}
                          className="inline-flex items-center gap-2 font-label-sm text-label-sm text-secondary shrink-0"
                        >
                          <Calendar size={14} className="text-secondary/70" aria-hidden />
                          {post.date}
                        </time>
                      )}
                      <Link
                        href={`/posts/${post.slug}`}
                        className="inline-flex items-center gap-1.5 font-label-sm text-tertiary hover:text-primary transition-colors ml-auto shrink-0"
                      >
                        Read More
                        <ArrowRight size={14} aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
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
