import type React from 'react'
import type { Page, Post } from '@/payload-types'

import type { Locale } from '@/i18n/config'
import { withLocalePrefix, stripLocalePrefix } from '@/i18n/localePath'
import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  /** Path without locale prefix, e.g. `/buy` or `/posts/slug`. */
  url: string
  locale?: Locale
}

function normalizeRedirectFrom(value: string): string {
  const path = value.split('?')[0] || '/'
  const stripped = stripLocalePrefix(path)
  return stripped.length > 1 && stripped.endsWith('/') ? stripped.slice(0, -1) : stripped
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url, locale }) => {
  const redirects = await getCachedRedirects()()
  const requestPath = normalizeRedirectFrom(url)

  const redirectItem = redirects.find((redirectRow) => {
    if (!redirectRow.from) return false
    return normalizeRedirectFrom(redirectRow.from) === requestPath
  })

  if (redirectItem) {
    if (redirectItem.to?.url) {
      const target = redirectItem.to.url
      if (/^https?:\/\//i.test(target)) {
        redirect(target)
      }
      redirect(locale ? withLocalePrefix(target, locale) : target)
    }

    let redirectUrl: string

    if (typeof redirectItem.to?.reference?.value === 'string') {
      const collection = redirectItem.to?.reference?.relationTo
      const id = redirectItem.to?.reference?.value

      const document = (await getCachedDocument(collection, id)()) as Page | Post
      redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
        document?.slug
      }`
    } else {
      redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
        typeof redirectItem.to?.reference?.value === 'object'
          ? redirectItem.to?.reference?.value?.slug
          : ''
      }`
    }

    if (redirectUrl) {
      redirect(locale ? withLocalePrefix(redirectUrl, locale) : redirectUrl)
    }
  }

  if (disableNotFound) return null

  notFound()
}
