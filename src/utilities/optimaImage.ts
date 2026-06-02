import { OPTIMA_CONFIG } from '@/constants/optima'

type ResizeType = 'user' | 'property' | 'cms_medias'
type PropertyAttachment = {
  model_id?: unknown
  file_md5_name?: unknown
  publish_status?: unknown
  order?: unknown
}

const getFileNameFromPath = (value: string) => {
  const parts = value.split('/')
  return parts[parts.length - 1] || ''
}

const getImageExtension = (filename: string) => {
  const parts = filename.split('.')
  return (parts[parts.length - 1] || '').toLowerCase()
}

const resolveAttachmentName = (attachment: unknown) => {
  if (!attachment) return ''
  if (typeof attachment === 'string') return getFileNameFromPath(attachment)
  if (typeof attachment !== 'object') return ''

  const asRecord = attachment as Record<string, unknown>
  const localizedFileName =
    asRecord.file_name && typeof asRecord.file_name === 'object'
      ? ((asRecord.file_name as Record<string, unknown>).EN ??
        (asRecord.file_name as Record<string, unknown>).en ??
        Object.values(asRecord.file_name as Record<string, unknown>).find(
          (value) => typeof value === 'string' && value.trim(),
        ))
      : undefined

  const preferredCandidates = [
    asRecord.file_md5_name,
    asRecord.file_name,
    localizedFileName,
    asRecord.name,
    asRecord.url,
    asRecord.file_url,
  ]

  for (const candidate of preferredCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return getFileNameFromPath(candidate)
    }
  }

  return ''
}

/**
 * PHP-like resize helper for Optima images.
 * Mirrors existing ResizeImage behavior while centralizing fixed configuration.
 */
export const resizeOptimaImage = (
  url: string,
  size = 1200,
  type: ResizeType = 'cms_medias',
): string => {
  const trimmedUrl = (url || '').trim()
  if (!trimmedUrl) return ''

  if (type === 'user') {
    const fileName = getFileNameFromPath(trimmedUrl)
    return trimmedUrl.replace(fileName, `${size}/${fileName}`)
  }

  if (type === 'property') {
    if (trimmedUrl.startsWith('http')) {
      const urlParts = trimmedUrl.split('/')
      const fileName = urlParts.pop() || ''
      const beforeFile = urlParts.pop() || ''
      const prefix = `${urlParts.join('/')}/`
      return `${prefix}${size}/${fileName}`.replace(`/${beforeFile}/`, `/${size}/`)
    }

    return `${OPTIMA_CONFIG.propertyResizeBase}/${size}/${trimmedUrl}`
  }

  const fileName = getFileNameFromPath(trimmedUrl)
  if (!fileName) return ''

  if (getImageExtension(fileName) === 'svg') {
    return `${OPTIMA_CONFIG.imageUrlWithoutResize}${OPTIMA_CONFIG.siteId}/${fileName}`
  }

  return `${OPTIMA_CONFIG.imageUrl}${OPTIMA_CONFIG.siteId}/${size}/${fileName}`
}

export const getOptimaPropertyAttachmentImage = (attachment: unknown, size = 1000): string => {
  const fileName = resolveAttachmentName(attachment)
  if (!fileName) return ''
  return resizeOptimaImage(fileName, size, 'property')
}

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const isPublishedAttachment = (attachment: PropertyAttachment) => attachment.publish_status === true

export const getPublishedPropertyAttachmentImage = (attachments: unknown, size = 1000): string => {
  if (!Array.isArray(attachments)) return ''

  const published = (attachments as PropertyAttachment[])
    .filter(isPublishedAttachment)
    .sort(
      (a, b) =>
        asNumber(a.order, Number.MAX_SAFE_INTEGER) - asNumber(b.order, Number.MAX_SAFE_INTEGER),
    )

  const first = published[0]
  if (!first) return ''

  const modelId =
    typeof first.model_id === 'string' && first.model_id.trim() ? first.model_id.trim() : ''
  const fileMd5Name =
    typeof first.file_md5_name === 'string' && first.file_md5_name.trim()
      ? first.file_md5_name.trim()
      : ''

  if (!modelId || !fileMd5Name) return ''

  // Mirrors PHP:
  // self::$property_img_resize_link . '/' . $pic['model_id'] . '/' . $size . '/' . urldecode($pic['file_md5_name'])
  return `${OPTIMA_CONFIG.propertyResizeBase}${modelId}/${size}/${decodeURIComponent(fileMd5Name)}`
}
