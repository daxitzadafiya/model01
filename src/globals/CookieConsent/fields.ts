import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'

const EN_ONLY_DEEPL_HINT =
  'Edit in English only. Other languages refresh via DeepL when English changes on save.'

export const cookieConsentFields: Field[] = [
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
      description: `Short heading shown in the banner. ${EN_ONLY_DEEPL_HINT}`,
    },
  },
  {
    name: 'content',
    type: 'richText',
    localized: true,
    label: 'Cookie message',
    admin: {
      description: `Explain which cookies you use and why. Shown in the banner body. ${EN_ONLY_DEEPL_HINT}`,
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
          description: EN_ONLY_DEEPL_HINT,
        },
      },
      {
        name: 'rejectLabel',
        type: 'text',
        localized: true,
        defaultValue: 'Reject non-essential',
        admin: {
          width: '50%',
          description: `Leave empty to hide the reject button. ${EN_ONLY_DEEPL_HINT}`,
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
        description: `Optional link to your cookie or privacy policy page. Link label: ${EN_ONLY_DEEPL_HINT}`,
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
]
