type LocalizedRecord = Record<string, unknown>

const normalizeLocaleKey = (value: string) => value.toLowerCase().replace(/-/g, '_')

const buildLocaleCandidates = (locale: string) => {
  const safeLocale = (locale || 'en').trim()
  const normalized = normalizeLocaleKey(safeLocale)
  const language = normalized.split('_')[0] || 'en'

  return Array.from(
    new Set([
      normalized,
      language,
      normalized.toUpperCase(),
      language.toUpperCase(),
      'en',
      'en_us',
      'EN',
      'EN_US',
    ]),
  )
}

/**
 * Resolve translated text from CRM-style localized objects (EN/en_US/es_AR...).
 * If no locale match exists, returns first non-empty string value.
 */
export const getLocalizedText = (
  value: unknown,
  locale = 'en',
  fallback = '',
): string => {
  if (typeof value === 'string') return value.trim() || fallback
  if (!value || typeof value !== 'object') return fallback

  const record = value as LocalizedRecord
  const normalizedMap = new Map<string, string>()

  for (const [key, candidate] of Object.entries(record)) {
    if (typeof candidate === 'string' && candidate.trim()) {
      normalizedMap.set(normalizeLocaleKey(key), candidate)
    }
  }

  for (const key of buildLocaleCandidates(locale)) {
    const found = normalizedMap.get(normalizeLocaleKey(key))
    if (found) return found
  }

  for (const candidate of Object.values(record)) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }

  return fallback
}

