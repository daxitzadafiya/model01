import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { invalidateEmailTransportCache } from '@/email/dynamicEmailTransport'

export const EmailSettings: GlobalConfig = {
  slug: 'emailSettings',
  label: 'Email settings',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'SMTP credentials and notification recipient for form submissions and other site emails. Credentials are stored in the database — not in environment variables.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable outbound email',
    },
    {
      name: 'smtp',
      type: 'group',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
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
          label: 'Use TLS (port 465)',
          admin: {
            description: 'Enable for implicit TLS on port 465. Leave off for STARTTLS on port 587.',
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
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
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
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
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
  hooks: {
    afterChange: [
      () => {
        invalidateEmailTransportCache()
      },
    ],
  },
}
