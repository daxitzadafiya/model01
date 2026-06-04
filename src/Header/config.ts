import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    link({
      appearances: false,
      overrides: {
        name: 'favoritesLink',
        label: 'Favorites link',
        admin: {
          description:
            'Destination for the header heart icon. Link to your Favorites page (internal page reference or custom URL).',
        },
      },
    }),
    {
      name: 'navItems',
      type: 'array',
      localized: true,
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        description: 'Navigation links for the current locale (switch locale in the admin bar to edit each language).',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
