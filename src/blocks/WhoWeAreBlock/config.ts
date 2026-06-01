import type { Block } from 'payload'
import { link } from '@/fields/link'

export const WhoWeAreBlock: Block = {
  slug: 'whoWeAreBlock',
  interfaceName: 'WhoWeAreBlock',
  labels: {
    singular: 'Who We Are',
    plural: 'Who We Are Sections',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'WHO WE ARE',
      admin: {
        description: 'Small uppercase label displayed above the title',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Main seriffed heading of the section',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Main narrative text explaining who you are',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Featured brand image',
      },
    },
    {
      name: 'pillars',
      type: 'array',
      maxRows: 3,
      admin: {
        description: 'Core values, standards, or highlights (max 3 items)',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            placeholder: 'e.g. Uncompromising Excellence',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: {
            placeholder: 'e.g. We set the standard for quality across all projects.',
          },
        },
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'Star', value: 'star' },
            { label: 'Heart', value: 'heart' },
            { label: 'Shield', value: 'shield' },
            { label: 'Trending Up', value: 'trending-up' },
            { label: 'Award', value: 'award' },
            { label: 'Eye', value: 'eye' },
          ],
          defaultValue: 'star',
        },
      ],
    },
    {
      name: 'buttonText',
      type: 'text',
      admin: {
        description: 'Text displayed on the call-to-action button',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'Call to Action',
      },
    }),
  ],
}
