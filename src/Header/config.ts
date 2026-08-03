import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { headerFields } from './fields'
import { autoTranslateHeaderContent } from './hooks/autoTranslateHeaderContent'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: a('admin.header.label', 'Header'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.header.description',
      'Edit localized header copy in English; other locales update via DeepL on save when DeepL is enabled.',
    ),
  },
  fields: headerFields,
  hooks: {
    afterChange: [autoTranslateHeaderContent, revalidateHeader],
  },
}
