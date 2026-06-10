import fs from 'fs/promises'
import path from 'path'

import { getLogoSources } from '@/components/Logo/getLogoSources'
import type { Logo, Media } from '@/payload-types'
import { toRelativeMediaPath } from '@/utilities/getMediaUrl'
import { getServerSideURL } from '@/utilities/getURL'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

function guessMimeType(filename: string, fallback?: string | null): string {
  if (fallback) return fallback
  const ext = path.extname(filename).slice(1).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'image/png'
}

function toAbsoluteUrl(relativePath: string, serverURL: string): string {
  if (!relativePath) return serverURL
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath
  const base = serverURL.replace(/\/$/, '')
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`
}

function getLightLogoMedia(logo?: Logo | null): Media | null {
  const lightLogo = logo?.lightLogo
  if (lightLogo && typeof lightLogo === 'object') return lightLogo

  const darkLogo = logo?.darkLogo
  if (darkLogo && typeof darkLogo === 'object') return darkLogo

  return null
}

function resolveLocalFilePath(src: string): string | null {
  const relativePath = toRelativeMediaPath(src).split('?')[0]

  if (relativePath.startsWith('/api/media/file/')) {
    const filename = decodeURIComponent(relativePath.slice('/api/media/file/'.length))
    return path.join(process.cwd(), 'public/media', filename)
  }

  if (relativePath.startsWith('/media/')) {
    const filename = decodeURIComponent(relativePath.slice('/media/'.length))
    return path.join(process.cwd(), 'public/media', filename)
  }

  if (relativePath.startsWith('/') && !relativePath.startsWith('//')) {
    return path.join(process.cwd(), 'public', relativePath.slice(1))
  }

  return null
}

async function readFileAsDataUri(filePath: string, mimeType: string): Promise<string | null> {
  try {
    const buffer = await fs.readFile(filePath)
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

async function fetchAsDataUri(url: string, mimeType?: string | null): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType =
      mimeType || response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'

    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Embeds the site logo as a base64 data URI so it displays in email clients
 * that block remote images or when the site URL is not publicly reachable.
 */
export async function resolveEmailLogoDataUri(logo?: Logo | null): Promise<string> {
  const logoSources = getLogoSources(logo)
  const serverURL = getServerSideURL()
  const media = getLightLogoMedia(logo)
  const src = logoSources.lightSrc
  const mimeType = guessMimeType(media?.filename ?? src, media?.mimeType)
  const absoluteUrl = toAbsoluteUrl(src, serverURL)

  if (media?.filename) {
    const mediaPath = path.join(process.cwd(), 'public/media', media.filename)
    const dataUri = await readFileAsDataUri(mediaPath, mimeType)
    if (dataUri) return dataUri
  }

  const localPath = resolveLocalFilePath(src)
  if (localPath) {
    const dataUri = await readFileAsDataUri(localPath, mimeType)
    if (dataUri) return dataUri
  }

  const fetched = await fetchAsDataUri(absoluteUrl, media?.mimeType)
  if (fetched) return fetched

  return absoluteUrl
}
