import type { GlobalConfig } from 'payload'

import { revalidateTheme } from './hooks/revalidateTheme'
import { THEME_CUSTOM_CSS_TEMPLATE } from './siteThemeTokens.mjs'

export const Theme: GlobalConfig = {
  slug: 'theme',
  label: 'Theme',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Site-wide CSS variables for Tailwind classes (bg-primary, text-tertiary, border-outline-variant, etc.).',
  },
  hooks: {
    afterChange: [revalidateTheme],
  },
  fields: [
    {
      name: 'customCSS',
      type: 'code',
      label: 'Custom CSS',
      defaultValue: THEME_CUSTOM_CSS_TEMPLATE,
      admin: {
        language: 'css',
        description:
          'Defines :root variables used by Tailwind classes (e.g. --color-primary for bg-primary / text-primary). When empty, the default palette is used.',
      },
    },
  ],
}
