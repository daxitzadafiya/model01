import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import type { Locale } from '@/i18n/config'
import { localeCodes } from '@/i18n/config'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const slugParams = (pages.docs || [])
    .filter((doc) => doc.slug && doc.slug !== 'home')
    .map(({ slug }) => String(slug))
    .filter(Boolean)

  return localeCodes.flatMap((locale) =>
    slugParams.map((slug) => ({
      locale,
      slug,
    })),
  )
}

type Args = {
  params: Promise<{
    locale: string
    slug?: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { isEnabled: draft } = await draftMode()
  const [params, searchParams] = await Promise.all([paramsPromise, searchParamsPromise])
  const { locale } = await getActiveLocale(params.locale)
  const slug = params.slug ?? 'home'
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  // Remove this code once your website is seeded
  if (!page && decodedSlug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} locale={locale} />
  }

  const { hero, layout } = page

  return (
    <article className="">
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} locale={locale} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} searchParams={searchParams} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const params = await paramsPromise
  const { locale } = await getActiveLocale(params.locale)
  const slug = params.slug ?? 'home'
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  return generateMeta({ doc: page, locale })
}

const queryPageBySlug = cache(async ({ slug, locale }: { slug: string; locale: Locale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    locale,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
