import type { Field, TextFieldSingleValidation } from 'payload'
import {
  AlignFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

export const emailTemplateEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
    AlignFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    HorizontalRuleFeature(),
    LinkFeature({
      enabledCollections: ['pages', 'posts'],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
              description:
                'Use mailto:email@example.com, tel:+34000000000, or https:// for website links.',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
    UploadFeature({
      collections: {
        media: {
          fields: [],
        },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

type EmailTemplateFieldDefaults = {
  subject?: string
  content?: Record<string, unknown>
}

export function emailTemplateFields(defaults?: EmailTemplateFieldDefaults): Field[] {
  return [
    {
      name: 'subject',
      type: 'text',
      localized: true,
      required: true,
      label: 'Automated response email subject',
      defaultValue: defaults?.subject,
      admin: {
        description:
          'Email subject line. Use {{reference}} for the property reference (also {{arrival}}, {{departure}}, {{guests}} on holiday booking emails). Switch locale in the admin bar to edit each language.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      label: 'Automated response email body',
      defaultValue: defaults?.content,
      admin: {
        description:
          'Design the full email like a document. Use {{reference}} for the property reference (also {{arrival}}, {{departure}}, {{guests}} on holiday booking emails). Switch locale in the admin bar for other languages.',
      },
      editor: emailTemplateEditor,
    },
  ]
}
