import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'
import { crmServerFetch } from '@/utilities/crmServerFetch'
import { isAllowedDocumentDownloadUrl } from '@/utilities/documentDownloadToken'

const MAX_REDIRECTS = 3

export async function fetchAllowedDocument(
  url: string,
  settings: Pick<
    ResolvedOptimaCrmSettings,
    | 'apiUrl'
    | 'contactUrl'
    | 'imageUrl'
    | 'imageUrlWithoutResize'
    | 'commercialImageBase'
    | 'constructionsImageBase'
    | 'propertyResizeBase'
  >,
): Promise<Response> {
  let current = url

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isAllowedDocumentDownloadUrl(current, settings)) {
      throw new Error('Download URL is not allowed')
    }

    const response = await crmServerFetch(current, {
      method: 'GET',
      redirect: 'manual',
    })

    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get('location')
    if (!location) throw new Error('Download redirect is missing a location')
    current = new URL(location, current).toString()
  }

  throw new Error('Download redirect limit reached')
}

export function documentDownloadFilename(label: string | undefined, contentType: string): string {
  const cleaned = (label ?? '')
    .replace(/[^\w.\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const base = cleaned || 'document'
  const type = contentType.toLowerCase()
  const extension = type.includes('pdf')
    ? '.pdf'
    : type.includes('png')
      ? '.png'
      : type.includes('jpeg') || type.includes('jpg')
        ? '.jpg'
        : type.includes('webp')
          ? '.webp'
          : ''

  if (!extension || base.toLowerCase().endsWith(extension)) return base
  return `${base}${extension}`
}
