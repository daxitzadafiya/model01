import type { DeeplSetting } from '@/payload-types'

export type ResolvedDeepLSettings = {
  enabled: boolean
  apiUrl: string
  apiKey: string
}

export const EMPTY_DEEPL_SETTINGS: ResolvedDeepLSettings = {
  enabled: false,
  apiUrl: 'https://api.deepl.com',
  apiKey: '',
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

export function resolveDeepLSettingsFromGlobal(
  doc: DeeplSetting | null | undefined,
): ResolvedDeepLSettings {
  if (!doc || doc.enabled !== true) {
    return {
      enabled: false,
      apiUrl: pickString(doc?.apiUrl, EMPTY_DEEPL_SETTINGS.apiUrl),
      apiKey: '',
    }
  }

  return {
    enabled: true,
    apiUrl: pickString(doc.apiUrl, EMPTY_DEEPL_SETTINGS.apiUrl),
    apiKey: pickString(doc.apiKey, EMPTY_DEEPL_SETTINGS.apiKey),
  }
}
