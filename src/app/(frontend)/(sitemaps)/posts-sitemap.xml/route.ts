import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { localeCodes } from '@/i18n/config'
import { getLanguageMenuItems } from '@/i18n/getLanguageMenu'

const getPostsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const [results, languageMenu] = await Promise.all([
      payload.find({
        collection: 'posts',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      getLanguageMenuItems(),
    ])

    const locales =
      languageMenu.length > 0 ? languageMenu.map((item) => item.locale) : [...localeCodes]

    const dateFallback = new Date().toISOString()

    const sitemap = (results.docs || [])
      .filter((post) => Boolean(post?.slug))
      .flatMap((post) =>
        locales.map((locale) => ({
          loc: `${SITE_URL}/${locale}/posts/${post?.slug}`,
          lastmod: post.updatedAt || dateFallback,
        })),
      )

    return sitemap
  },
  ['posts-sitemap'],
  {
    tags: ['posts-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPostsSitemap()

  return getServerSideSitemap(sitemap)
}
