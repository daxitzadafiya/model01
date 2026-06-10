import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { invalidateEmailTransportCache } from '@/email/dynamicEmailTransport'
import { defaultClientConfirmationContent } from '@/email/defaultClientConfirmationContent'
import { emailTemplateFields } from '@/fields/emailTemplateFields'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const EmailSettings: GlobalConfig = {
  slug: 'emailSettings',
  label: 'Email settings',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'SMTP credentials, notification recipient, and client confirmation email templates.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable email sending',
    },
    {
      type: 'tabs',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
      tabs: [
        {
          label: 'SMTP & delivery',
          fields: [
            {
              name: 'smtp',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'host',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '70%',
                        description: 'SMTP server hostname (e.g. smtp.gmail.com).',
                      },
                    },
                    {
                      name: 'port',
                      type: 'number',
                      defaultValue: 587,
                      required: true,
                      admin: {
                        width: '30%',
                      },
                    },
                  ],
                },
                {
                  name: 'secure',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Use TLS',
                  admin: {
                    description:
                      'Enable for implicit TLS on port 465. Leave off for STARTTLS on port 587.',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'user',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '50%',
                        description: 'SMTP username (e.g. your email address for Gmail).',
                      },
                    },
                    {
                      name: 'password',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '50%',
                        description: 'SMTP password or app-specific password.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'sender',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromAddress',
                      type: 'email',
                      required: true,
                      admin: {
                        width: '50%',
                        description: 'From address shown on outgoing emails.',
                      },
                    },
                    {
                      name: 'fromName',
                      type: 'text',
                      required: true,
                      defaultValue: 'Horizon Estates',
                      admin: {
                        width: '50%',
                        description: 'From name shown on outgoing emails.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'notifications',
              type: 'group',
              fields: [
                {
                  name: 'recipientAddress',
                  type: 'email',
                  required: true,
                  label: 'Notification recipient',
                  admin: {
                    description:
                      'Where contact and property inquiry notifications are delivered (your team inbox).',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Customize client email template',
          description:
            'Automated thank-you email sent to the visitor after form submission. Use the locale switcher in the admin bar to edit English, Spanish, German, and other languages — like the language tabs in your CRM.',
          fields: [
            {
              name: 'clientConfirmation',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Send confirmation email to client',
                },
                {
                  name: 'contact',
                  type: 'group',
                  label: 'Contact form',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                  fields: emailTemplateFields({
                    subject: 'Thank you for your enquiry',
                    content: defaultClientConfirmationContent,
                  }),
                },
                {
                  name: 'propertyInquiry',
                  type: 'group',
                  label: 'Property inquiry',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                  fields: emailTemplateFields({
                    subject: 'Enquiry about property (Ref: {{reference}})',
                    content: defaultClientConfirmationContent,
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateEmailTransportCache()
        await revalidateCacheTag('global_emailSettings')
      },
    ],
  },
}
