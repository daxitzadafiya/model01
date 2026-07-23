import type { GlobalConfig } from 'payload'

import { footerFields } from './fields'
import { autoTranslateFooterContent } from './hooks/autoTranslateFooterContent'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Edit localized footer copy in English; other locales update via DeepL on save when DeepL is enabled.',
  },
  fields: footerFields,
  hooks: {
    afterChange: [autoTranslateFooterContent, revalidateFooter],
  },
}
