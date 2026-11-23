import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { defaultLocale, isLocale, type Locale } from '@/i18n/config'
import { getSiteDefaultLocale } from '@/i18n/getSiteDefaultLocale'

const getCachedSiteDefaultLocale = unstable_cache(
  async (): Promise<Locale> => {
    const payload = await getPayload({ config: configPromise })
    return getSiteDefaultLocale(payload)
  },
  ['site-default-locale'],
  {
    tags: ['global_localization'],
    revalidate: 300,
  },
)

export async function GET() {
  try {
    const locale = await getCachedSiteDefaultLocale()
    const value = isLocale(locale) ? locale : defaultLocale

    return NextResponse.json(
      { locale: value },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch {
    return NextResponse.json(
      { locale: defaultLocale },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    )
  }
}
