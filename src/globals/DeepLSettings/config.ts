import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const DeepLSettings: GlobalConfig = {
  slug: 'deeplSettings',
  label: 'DeepL',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'DeepL API credentials for auto-translating missing UI strings via t(). Stored in the database — not in environment variables.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable DeepL auto-translation',
    },
    {
      name: 'apiUrl',
      type: 'text',
      defaultValue: 'https://api.deepl.com',
      admin: {
        readOnly: true,
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: 'Use https://api-free.deepl.com for free-tier accounts.',
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: 'API key',
      required: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await revalidateCacheTag('global_deeplSettings')
      },
    ],
  },
}
