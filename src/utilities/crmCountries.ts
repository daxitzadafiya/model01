import { extractCRMList } from '@/utilities/crmProperties'
import { getCRMLocalizedText } from '@/utilities/localizedValue'

import { unwrapCRMJsonPayload } from './crmCoasts'

export type CRMCountryOption = {
  value: string
  label: string
  key: number
}

export type HeroDefaultCountrySlug = 'spain' | 'france' | 'portugal' | 'others'

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

const DEFAULT_COUNTRY_MATCHERS: Record<Exclude<HeroDefaultCountrySlug, 'others'>, string[]> = {
  spain: ['spain', 'españa', 'espana'],
  france: ['france'],
  portugal: ['portugal'],
}

const normalizeCountry = (
  doc: Record<string, unknown>,
  locale: string,
): CRMCountryOption | null => {
  const key = pickNumber(doc.key ?? doc.key_system ?? doc.id)
  if (key === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    pickString(doc.name) ||
    pickString(doc.country) ||
    String(key)

  return {
    value: String(key),
    label,
    key,
  }
}

export async function fetchCRMCountries(
  locale: string,
  init?: { signal?: AbortSignal },
): Promise<CRMCountryOption[]> {
  const lang = locale.trim() || 'en'
  const response = await fetch(`/api/crm/countries?lang=${encodeURIComponent(lang)}`, {
    signal: init?.signal,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`CRM countries failed (${response.status})`)
  }

  const raw = unwrapCRMJsonPayload((await response.json()) as unknown)
  const list = extractCRMList(raw)

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => normalizeCountry(item, lang))
    .filter((country): country is CRMCountryOption => country !== null)
    .sort((a, b) => a.label.localeCompare(b.label, lang))
}

export const resolveDefaultCountryKeys = (
  defaultCountry: string | undefined | null,
  countries: CRMCountryOption[],
): string[] => {
  if (!defaultCountry || defaultCountry === 'others' || !countries.length) return []

  const slug = defaultCountry as HeroDefaultCountrySlug
  const matchers =
    slug in DEFAULT_COUNTRY_MATCHERS
      ? DEFAULT_COUNTRY_MATCHERS[slug as Exclude<HeroDefaultCountrySlug, 'others'>]
      : [defaultCountry]

  const match = countries.find((country) =>
    matchers.some((term) => country.label.toLowerCase().includes(term)),
  )

  return match ? [match.value] : []
}
