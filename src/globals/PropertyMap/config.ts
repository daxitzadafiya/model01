import type { GlobalConfig } from 'payload'

import { propertyMapFields } from './fields'
import { autoTranslatePropertyMapContent } from './hooks/autoTranslatePropertyMapContent'
import { revalidatePropertyMap } from './hooks/revalidatePropertyMap'

export const PropertyMap: GlobalConfig = {
  slug: 'propertyMap',
  label: 'Property Map',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Default map center, zoom, and cluster styling for the property search map modal. Edit localized copy in English; other locales update via DeepL on save.',
  },
  hooks: {
    afterChange: [autoTranslatePropertyMapContent, revalidatePropertyMap],
  },
  fields: propertyMapFields,
}
