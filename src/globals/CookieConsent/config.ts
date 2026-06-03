import type { GlobalConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { revalidateCookieConsent } from './hooks/revalidateCookieConsent'

export const CookieConsent: GlobalConfig = {
  slug: 'cookieConsent',
  label: 'Cookie consent',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Banner shown on the public site until visitors accept or reject cookies. Edit the message and button labels per locale.',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show cookie banner',
    },
    {
      name: 'showCloseButton',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show close button',
      admin: {
        description: 'Lets visitors dismiss the banner for this session without saving a choice.',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: 'We use cookies',
      admin: {
        description: 'Short heading shown in the banner.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      label: 'Cookie message',
      admin: {
        description: 'Explain which cookies you use and why. Shown in the banner body.',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'acceptLabel',
          type: 'text',
          localized: true,
          defaultValue: 'Accept all',
          required: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'rejectLabel',
          type: 'text',
          localized: true,
          defaultValue: 'Reject non-essential',
          admin: {
            width: '50%',
            description: 'Leave empty to hide the reject button.',
          },
        },
      ],
    },
    link({
      appearances: false,
      overrides: {
        name: 'policyLink',
        label: 'Cookie / privacy policy link',
        admin: {
          description: 'Optional link to your cookie or privacy policy page.',
        },
      },
    }),
    {
      type: 'row',
      fields: [
        {
          name: 'storageKey',
          type: 'text',
          defaultValue: 'horizon-cookie-consent',
          required: true,
          admin: {
            width: '50%',
            description: 'Browser cookie name used to remember the visitor choice.',
          },
        },
        {
          name: 'expiryDays',
          type: 'number',
          defaultValue: 365,
          min: 1,
          max: 3650,
          required: true,
          admin: {
            width: '50%',
            description: 'How long the choice is remembered (days).',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateCookieConsent],
  },
}
