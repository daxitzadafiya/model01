import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { localeCodes } from '@/i18n/config'
import { getLanguageMenuItems } from '@/i18n/getLanguageMenu'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const [results, languageMenu] = await Promise.all([
      payload.find({
        collection: 'pages',
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

    const staticPaths = ['/search', '/posts']

    const pagePaths = (results.docs || [])
      .filter((page) => Boolean(page?.slug))
      .map((page) => ({
        path: page?.slug === 'home' ? '' : `/${page?.slug}`,
        lastmod: page.updatedAt || dateFallback,
      }))

    const sitemap = locales.flatMap((locale) => {
      const staticEntries = staticPaths.map((path) => ({
        loc: `${SITE_URL}/${locale}${path}`,
        lastmod: dateFallback,
      }))

      const pageEntries = pagePaths.map(({ path, lastmod }) => ({
        loc: path ? `${SITE_URL}/${locale}${path}` : `${SITE_URL}/${locale}`,
        lastmod,
      }))

      return [...staticEntries, ...pageEntries]
    })

    return sitemap
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()

  return getServerSideSitemap(sitemap)
}
