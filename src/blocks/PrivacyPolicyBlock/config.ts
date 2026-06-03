import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'

const richTextField = (name: string, label: string): Field => ({
  name,
  type: 'richText',
  localized: true,
  label,
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
})

export const PrivacyPolicyBlock: Block = {
  slug: 'privacyPolicyBlock',
  dbName: 'pp',
  interfaceName: 'PrivacyPolicyBlock',
  labels: {
    singular: 'Privacy Policy Layout',
    plural: 'Privacy Policy Layouts',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Legal Integrity',
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Privacy Policy',
    },
    {
      name: 'introText',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Last updated: May 24, 2026. This policy outlines our commitment to protecting your digital footprint with the same discretion we apply to our physical estates.',
    },
    {
      name: 'tocTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Table of Contents',
    },
    {
      name: 'sections',
      type: 'array',
      dbName: 'secs',
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'anchorId',
          type: 'text',
          required: true,
          admin: {
            description: 'Used for in-page navigation anchor (e.g. introduction, data-collection).',
          },
        },
        {
          name: 'tocLabel',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: '01. Introduction',
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: '01. Introduction',
        },
        richTextField('body', 'Body content'),
        {
          name: 'highlightQuote',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Optional highlighted quote panel.',
          },
        },
        {
          name: 'featureCards',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              required: true,
              defaultValue: 'person',
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              required: true,
            },
          ],
        },
        {
          name: 'bulletItems',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              defaultValue: 'check_circle',
            },
            {
              name: 'text',
              type: 'textarea',
              localized: true,
              required: true,
            },
          ],
        },
        {
          name: 'visualPanel',
          type: 'group',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'icon',
              type: 'text',
              defaultValue: 'lock',
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              defaultValue: 'Encrypted Protocols',
            },
          ],
        },
        {
          name: 'contactPanel',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
            {
              name: 'email',
              type: 'email',
            },
            {
              name: 'buttonLabel',
              type: 'text',
              localized: true,
              admin: {
                description: 'Text shown on the button.',
              },
            },
            link({
              appearances: false,
              disableLabel: true,
              overrides: {
                name: 'buttonLink',
                dbName: 'blink',
                label: 'Button action',
                admin: {
                  description:
                    'Internal page or custom URL. If empty, the button uses a mailto link to the email above.',
                },
              },
            }),
          ],
        },
        {
          name: 'showDividerBefore',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
