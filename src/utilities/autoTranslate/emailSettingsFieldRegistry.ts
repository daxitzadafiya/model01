import { emailTemplateFields } from '@/fields/emailTemplateFields'

import { discoverLocalizedFields } from './discoverFieldPaths'

/** Client confirmation template groups under Email Settings → Customize client email template. */
export const EMAIL_SETTINGS_TEMPLATE_GROUPS = [
  'contact',
  'propertyInquiry',
  'holidayBooking',
  'saveSearch',
  'documentDownload',
] as const

const templateFields = emailTemplateFields()

const discovered = EMAIL_SETTINGS_TEMPLATE_GROUPS.flatMap((group) =>
  discoverLocalizedFields(templateFields, `clientConfirmation.${group}`),
)

export const EMAIL_SETTINGS_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
