import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const DeepLSettings: GlobalConfig = {
  slug: 'deeplSettings',
  label: a('admin.deeplSettings.label', 'DeepL'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.deeplSettings.description',
      'DeepL API credentials for auto-translating missing UI strings via t() (frontend and admin.* keys). Stored in the database — not in environment variables.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: a('admin.deeplSettings.enabled', 'Enable DeepL auto-translation'),
    },
    {
      name: 'apiUrl',
      type: 'text',
      defaultValue: 'https://api.deepl.com',
      label: a('admin.deeplSettings.apiUrl', 'API URL'),
      admin: {
        readOnly: true,
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.deeplSettings.apiUrl.description',
          'Use https://api-free.deepl.com for free-tier accounts.',
        ),
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: a('admin.deeplSettings.apiKey', 'API key'),
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
