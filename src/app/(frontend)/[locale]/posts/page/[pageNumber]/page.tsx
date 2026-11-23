import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { notFound } from 'next/navigation'

import { localeCodes } from '@/i18n/config'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { t } from '@/utilities/translate'

export const revalidate = 600

type Args = {
  params: Promise<{
    locale: string
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale: localeParam, pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const { locale } = await getActiveLocale(localeParam)
  const postsHeading = await t('posts.heading', locale, 'Posts')

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    locale,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{postsHeading}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: localeParam, pageNumber } = await paramsPromise
  const { locale } = await getActiveLocale(localeParam)
  const logo = await getCachedGlobal('logo', 0)()
  const appName = getAppName(logo)

  return {
    title: formatPageTitle(pageNumber ? `Posts Page ${pageNumber}` : 'Posts', appName),
    alternates: {
      canonical: `/${locale}/posts/page/${pageNumber}`,
    },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'posts',
    overrideAccess: false,
  })

  const totalPages = Math.ceil(totalDocs / 10)

  const pages: { locale: string; pageNumber: string }[] = []

  for (const locale of localeCodes) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ locale, pageNumber: String(i) })
    }
  }

  return pages
}
