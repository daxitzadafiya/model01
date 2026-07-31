import { cache } from 'react'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import configPromise from '@payload-config'
import { getCRMLocalizedText } from '@/utilities/localizedValue'
import {
  ensureCountriesSeeded,
  syncCountriesFromCRM,
} from '@/utilities/syncCountriesFromCRM'
import type { SiteCountryOption, SiteCountryRow } from '@/utilities/siteCountries.shared'

function mapRowToOption(row: SiteCountryRow, locale: string): SiteCountryOption | null {
  const key = typeof row.key === 'number' && Number.isFinite(row.key) ? row.key : null
  if (key === null) return null

  const label =
    getCRMLocalizedText(row.names, locale) ||
    row.adminLabel?.trim() ||
    row.isoCode?.trim() ||
    String(key)

  return {
    value: String(key),
    label,
    key,
    isoCode: row.isoCode?.trim() || undefined,
    isDefault: row.isDefault === true,
  }
}

function isActiveSaleCountry(row: SiteCountryRow): boolean {
  if (row.showOnSite !== true) return false
  if (row.offerSale !== true) return false
  const status = row.status?.trim().toLowerCase()
  if (status && status !== 'active') return false
  return true
}

async function findSaleCountries(locale: string): Promise<SiteCountryOption[]> {
  const payload = await getPayload({ config: configPromise })
  await ensureCountriesSeeded(payload)

  const result = await payload.find({
    collection: 'countries',
    depth: 0,
    limit: 1000,
    pagination: false,
    where: {
      and: [{ showOnSite: { equals: true } }, { offerSale: { equals: true } }],
    },
    sort: 'adminLabel',
  })

  return (result.docs as SiteCountryRow[])
    .filter(isActiveSaleCountry)
    .map((row) => mapRowToOption(row, locale))
    .filter((row): row is SiteCountryOption => row !== null)
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }))
}

/**
 * Site countries enabled for Sale filters (hero + for-sale listing).
 * Seeds from CRM automatically when the Countries collection is empty.
 */
export const getSiteCountriesForSale = cache(async (locale = 'en'): Promise<SiteCountryOption[]> => {
  try {
    const localeKey = locale || 'en'
    return await unstable_cache(
      async () => findSaleCountries(localeKey),
      ['site-countries-for-sale', localeKey],
      {
        tags: ['collection_countries', `collection_countries_${localeKey}`],
      },
    )()
  } catch (error) {
    console.error('Failed to load site countries', error)
    return []
  }
})

export { syncCountriesFromCRM, ensureCountriesSeeded }
