import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

export const Translations: CollectionConfig = {
  slug: 'translations',
  labels: {
    singular: 'Translation',
    plural: 'Translations',
  },
  access: {
    create: () => false,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'translations', 'updatedAt'],
    description:
      'UI strings created automatically by the app when t() runs. Edit translations here; do not add keys manually.',
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Set automatically by the app (e.g. propertyList.filters.search).',
      },
    },
    {
      name: 'translations',
      type: 'json',
      required: true,
      admin: {
        description:
          'One text field per language enabled in Globals → Localization. Add languages there to edit more locales here.',
        components: {
          Cell: '@/collections/Translations/TranslationsCell#TranslationsCell',
          Field: '@/collections/Translations/TranslationsField#TranslationsField',
        },
      },
    },
  ],
}
