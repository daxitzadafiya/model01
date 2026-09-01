import { describe, expect, it } from 'vitest'

import {
  dropEmptyOptionRows,
  ensureLocalizedOptionLabel,
  fillAllLocaleLabels,
  flattenOptionLabelsForSave,
} from '@/globals/PropertyFilters/hooks/ensureOptionLabels'
import type { FieldHookArgs } from 'payload'

const LOCALES = ['en', 'de', 'el', 'fr', 'es', 'it', 'nl'] as const

function runHook(
  args: Partial<FieldHookArgs> & { siblingData: Record<string, unknown> },
) {
  return ensureLocalizedOptionLabel({
    req: {
      locale: 'es',
      payload: { config: { localization: { localeCodes: [...LOCALES] } } },
    },
    siblingDocWithLocales: {},
    value: undefined,
    ...args,
  } as FieldHookArgs)
}

describe('property filter option labels', () => {
  it('seeds every CMS locale so version inserts are never null', () => {
    const siblingDocWithLocales: { label?: Record<string, string> } = {}

    const result = runHook({
      siblingData: { value: '10m+', min: '10000000', max: 'any' },
      siblingDocWithLocales,
      value: undefined,
    })

    expect(result).toBe('10m+')
    expect(siblingDocWithLocales.label).toEqual({
      en: '10m+',
      de: '10m+',
      el: '10m+',
      fr: '10m+',
      es: '10m+',
      it: '10m+',
      nl: '10m+',
    })
  })

  it('keeps existing translations when filling missing locales', () => {
    expect(
      fillAllLocaleLabels(
        { en: 'Any Price', es: 'Cualquier precio', de: null, nl: '' },
        'any',
        LOCALES,
      ),
    ).toEqual({
      en: 'Any Price',
      de: 'Any Price',
      el: 'Any Price',
      fr: 'Any Price',
      es: 'Cualquier precio',
      it: 'Any Price',
      nl: 'Any Price',
    })
  })

  it('backfills an empty label from value on new array rows', () => {
    const rows = dropEmptyOptionRows([
      { value: '10m+', min: '10000000', max: 'any' },
      { value: '', label: '', min: '', max: '' },
    ])

    expect(rows).toEqual([{ value: '10m+', min: '10000000', max: 'any', label: '10m+' }])
  })

  it('does not replace a typed label with the value-seeded 500k-600k copy', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '500k-600k'])),
    }

    const result = runHook({
      siblingData: { value: '500k-600k', min: '500000', max: '600000' },
      siblingDocWithLocales,
      value: '€ 500 000 - € 600 000',
    })

    expect(result).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label.es).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label.en).toBe('€ 500 000 - € 600 000')
  })

  it('keeps real translations when only the current locale is edited', () => {
    const siblingDocWithLocales = {
      label: {
        en: '€500k - €600k',
        de: '500.000 € - 600.000 €',
        el: '500k-600k',
        fr: '500k-600k',
        es: '500k-600k',
        it: '500k-600k',
        nl: '500k-600k',
      },
    }

    const result = runHook({
      siblingData: { value: '500k-600k', min: '500000', max: '600000' },
      siblingDocWithLocales,
      value: '€ 500 000 - € 600 000',
    })

    expect(result).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label).toEqual({
      en: '€500k - €600k',
      de: '500.000 € - 600.000 €',
      el: '€ 500 000 - € 600 000',
      fr: '€ 500 000 - € 600 000',
      es: '€ 500 000 - € 600 000',
      it: '€ 500 000 - € 600 000',
      nl: '€ 500 000 - € 600 000',
    })
  })

  it('replaces identical copies of the previous display label, not only the value key', () => {
    const previous = '€ 900 000 - 1m'
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
    }

    const result = runHook({
      previousValue: previous,
      siblingData: { value: '900k-1m', min: '900000', max: '1000000' },
      siblingDocWithLocales,
      value: '€ 900 000 - 1 millón',
    })

    expect(result).toBe('€ 900 000 - 1 millón')
    expect(typeof result).toBe('string')
    expect(siblingDocWithLocales.label.es).toBe('€ 900 000 - 1 millón')
    expect(siblingDocWithLocales.label.en).toBe('€ 900 000 - 1 millón')
  })

  it('returns a string when the form submits a locale map so Payload does not nest it', () => {
    const previous = '€ 900 000 - 1m'
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
    }

    const result = runHook({
      previousValue: previous,
      siblingData: { value: '900k-1m', min: '900000', max: '1000000' },
      siblingDocWithLocales,
      value: {
        ...Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
        es: '€ 900 000 - 1 millón',
      },
    })

    expect(result).toBe('€ 900 000 - 1 millón')
    expect(siblingDocWithLocales.label.es).toBe('€ 900 000 - 1 millón')
  })

  it('flattens locale-map labels to the current locale before nested field hooks', () => {
    const rows = flattenOptionLabelsForSave(
      [
        {
          value: '900k-1m',
          label: {
            en: '€ 900 000 - 1m',
            es: '€ 900 000 - 1 millón',
          },
        },
      ],
      'es',
    )

    expect(rows).toEqual([{ value: '900k-1m', label: '€ 900 000 - 1 millón' }])
  })
})
