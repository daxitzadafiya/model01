import type { Metadata } from 'next'

import type { Locale } from '@/i18n/config'
import { isLocale } from '@/i18n/config'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { withLocalePrefix } from '@/i18n/localePath'
import { toOpenGraphLocale } from '@/i18n/siteLangQuery'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { fetchCRMProjectDetailServer } from '@/utilities/crmProjectDetail.server'
import { fetchCRMPropertyDetailServer } from '@/utilities/crmPropertyDetail.server'
import { normalizeCRMProperty } from '@/utilities/crmProperties'
import { normalizeCRMProject, PROPERTY_DETAIL_IMAGE_SIZE } from '@/utilities/crmProjects'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { extractReferenceFromSlug } from '@/utilities/propertyUrl'
import { getServerSideURL } from '@/utilities/getURL'

const META_DESCRIPTION_MAX = 200

function toPlainMetaDescription(value?: string | null): string | undefined {
  if (!value) return undefined
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return undefined
  if (text.length <= META_DESCRIPTION_MAX) return text
  return `${text.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`
}

function toAbsoluteImageUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = getServerSideURL().replace(/\/+$/, '')
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

async function resolveDetailMetaLocale(localeParam?: string | null): Promise<Locale> {
  if (localeParam && isLocale(localeParam)) {
    const { locale } = await getActiveLocale(localeParam)
    return locale
  }
  const { locale } = await getActiveLocale()
  return locale
}

function buildDetailMetadata(args: {
  title: string
  description?: string
  imageUrl?: string
  imageAlt: string
  path: string
  appName: string
  locale: Locale
}): Metadata {
  const { title, description, imageUrl, imageAlt, path, appName, locale } = args
  const absoluteImage = toAbsoluteImageUrl(imageUrl)
  const localizedPath = withLocalePrefix(path, locale)

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
    },
    openGraph: mergeOpenGraph({
      title,
      description: description || '',
      siteName: appName,
      url: localizedPath,
      locale: toOpenGraphLocale(locale),
      images: absoluteImage
        ? [
            {
              url: absoluteImage,
              alt: imageAlt,
              width: PROPERTY_DETAIL_IMAGE_SIZE,
            },
          ]
        : undefined,
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
  }
}

export async function generatePropertyDetailMeta(
  slug: string,
  localeParam?: string | null,
): Promise<Metadata> {
  const [locale, logo] = await Promise.all([
    resolveDetailMetaLocale(localeParam),
    getCachedGlobal('logo', 0)(),
  ])
  const appName = getAppName(logo)
  const fallbackTitle = formatPageTitle('Property Details', appName)
  const reference = extractReferenceFromSlug(slug)

  if (!reference) {
    return { title: fallbackTitle }
  }

  let raw = await fetchCRMPropertyDetailServer(reference)
  if (!raw) {
    raw = await fetchCRMPropertyDetailServer(reference, { statuses: ['Sold'] })
  }

  if (!raw) {
    return { title: fallbackTitle }
  }

  const property = normalizeCRMProperty(raw, locale, {
    attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
  })

  return buildDetailMetadata({
    title: formatPageTitle(property.title, appName),
    description: toPlainMetaDescription(property.description),
    imageUrl: property.imageUrl,
    imageAlt: property.title,
    path: `/property-details/${encodeURIComponent(slug)}`,
    appName,
    locale,
  })
}

export async function generateProjectDetailMeta(
  slug: string,
  localeParam?: string | null,
): Promise<Metadata> {
  const [locale, logo] = await Promise.all([
    resolveDetailMetaLocale(localeParam),
    getCachedGlobal('logo', 0)(),
  ])
  const appName = getAppName(logo)
  const fallbackTitle = formatPageTitle('Project Details', appName)
  const reference = extractReferenceFromSlug(slug)

  if (!reference) {
    return { title: fallbackTitle }
  }

  const raw = await fetchCRMProjectDetailServer(reference, { locale })
  if (!raw) {
    return { title: fallbackTitle }
  }

  const project = normalizeCRMProject(raw, locale, {
    attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
  })

  return buildDetailMetadata({
    title: formatPageTitle(project.title, appName),
    description: toPlainMetaDescription(project.description),
    imageUrl: project.imageUrl,
    imageAlt: project.title,
    path: `/project-details/${encodeURIComponent(slug)}`,
    appName,
    locale,
  })
}
