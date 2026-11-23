import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import type { Locale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/localePath'
import { getCachedGlobal } from '@/utilities/getGlobals'

import { formatPageTitle, getAppName } from './getAppName'
import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

function resolveDocPath(
  doc: Partial<Page> | Partial<Post> | null | undefined,
  collection: 'pages' | 'posts' = 'pages',
): string {
  if (!doc?.slug) return '/'
  const slug = Array.isArray(doc.slug) ? doc.slug.join('/') : String(doc.slug)
  if (!slug || slug === 'home') return '/'
  if (collection === 'posts') return `/posts/${slug}`
  return `/${slug}`
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  locale?: Locale
  collection?: 'pages' | 'posts'
}): Promise<Metadata> => {
  const { doc, locale, collection = 'pages' } = args

  const logo = await getCachedGlobal('logo', 0)()
  const appName = getAppName(logo)
  const ogImage = getImageURL(doc?.meta?.image)
  const title = formatPageTitle(doc?.meta?.title, appName)
  const path = resolveDocPath(doc, collection)
  const localizedPath = locale ? withLocalePrefix(path, locale) : path

  return {
    description: doc?.meta?.description,
    alternates: {
      canonical: localizedPath,
    },
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      siteName: appName,
      title,
      url: localizedPath,
    }),
    title,
  }
}
