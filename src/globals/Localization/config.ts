import type { GlobalConfig, Option } from 'payload'

import {
  cmsLocales,
  flagCountryOptions,
  localeCodes,
  type Locale,
} from '@/i18n/locales'

import { revalidateLocalization } from './hooks/revalidateLocalization'

const contentLocaleOptions = cmsLocales.map(({ code, label }) => ({
  label: `${label} (${code})`,
  value: code,
}))

function getSelectOptionValue(option: Option): string {
  if (typeof option === 'string') return option
  if ('value' in option && option.value != null) return String(option.value)
  return ''
}

export const Localization: GlobalConfig = {
  slug: 'localization',
  label: 'Localization',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Languages listed here appear on the website switcher and in the admin “Locale” menu (top right). Content locale must exist in src/i18n/locales.ts. Add a row per language, then save.',
  },
  fields: [
    {
      name: 'languages',
      type: 'array',
      label: 'Site languages',
      admin: {
        description:
          'Add languages with + Add Language. Content locale must be a code from the list (not a display name like "Deutsch").',
        initCollapsed: false,
      },
      defaultValue: [
        {
          locale: 'en',
          label: 'En - UK',
          shortCode: 'EN',
          flag: 'gb',
          enabled: true,
        },
        {
          locale: 'de',
          label: 'Deutsch',
          shortCode: 'DE',
          flag: 'de',
          enabled: true,
        },
      ],
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Show on site',
          defaultValue: true,
        },
        {
          name: 'locale',
          type: 'select',
          label: 'Content locale',
          required: true,
          options: contentLocaleOptions,
          filterOptions: ({ options, data, siblingData }) => {
            const usedLocales =
              (data as { languages?: { locale?: string }[] } | undefined)?.languages
                ?.map((row) => row?.locale)
                .filter((code): code is string => Boolean(code)) ?? []

            return options.filter((option) => {
              const value = getSelectOptionValue(option)
              if (!value) return false
              if (value === siblingData?.locale) return true
              return !usedLocales.includes(value)
            })
          },
          admin: {
            description: `CMS code (not the display name). Pool: ${localeCodes.join(', ')} — only codes you add in src/i18n/locales.ts.`,
          },
          validate: (value: string | null | undefined) => {
            if (!value || !localeCodes.includes(value as Locale)) {
              return `Choose a valid locale code (${localeCodes.join(', ')}). Display names belong in "Display name", not here.`
            }
            return true
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Display name',
          required: true,
          admin: {
            description: 'Menu label (e.g. En - UK, Deutsch, Ελληνικά)',
          },
        },
        {
          name: 'shortCode',
          type: 'text',
          label: 'Short code',
          required: true,
          maxLength: 6,
          admin: {
            description: 'Header badge (e.g. EN, DE, EL)',
          },
        },
        {
          name: 'flag',
          type: 'select',
          label: 'Flag',
          required: true,
          options: [...flagCountryOptions],
        },
      ],
      validate: (rows) => {
        if (!rows || !Array.isArray(rows)) return true

        const seen = new Set<string>()
        for (const row of rows) {
          const code = (row as { locale?: string | null })?.locale
          if (!code) continue
          if (seen.has(code)) {
            return `Each language must use a different Content locale. Duplicate: ${code}`
          }
          seen.add(code)
        }
        return true
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const languages = data?.languages
        if (!Array.isArray(languages)) return data

        return {
          ...data,
          languages: languages.map((row) => {
            if (!row?.locale) return row
            const code = String(row.locale)
            if (localeCodes.includes(code as Locale)) return row

            const byLabel = cmsLocales.find(
              (l) => l.label.toLowerCase() === code.toLowerCase(),
            )
            if (byLabel) {
              return { ...row, locale: byLabel.code }
            }

            return row
          }),
        }
      },
    ],
    afterChange: [revalidateLocalization],
  },
}
