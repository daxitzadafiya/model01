import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { footerFields } from './fields'
import { autoTranslateFooterContent } from './hooks/autoTranslateFooterContent'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: a('admin.footer.label', 'Footer'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.footer.description',
      'Edit localized footer copy in English; other locales update via DeepL on save when DeepL is enabled.',
    ),
  },
  fields: footerFields,
  hooks: {
    afterChange: [autoTranslateFooterContent, revalidateFooter],
  },
}
