import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getFaviconSource } from '@/components/Logo/getLogoSources'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })

  try {
    const logo = await payload.findGlobal({
      slug: 'logo',
      depth: 1,
    })

    const favicon = getFaviconSource(logo)
    return Response.redirect(new URL(favicon, request.url), 302)
  } catch {
    return Response.redirect(new URL('/favicon.ico', request.url), 302)
  }
}
