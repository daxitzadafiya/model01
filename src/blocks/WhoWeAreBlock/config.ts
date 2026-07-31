import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const WhoWeAreBlock: Block = {
  slug: 'whoWeAreBlock',
  interfaceName: 'WhoWeAreBlock',
  labels: {
    singular: a('admin.blocks.whoWeAreBlock.singular', 'Who We Are'),
    plural: a('admin.blocks.whoWeAreBlock.plural', 'Who We Are Sections'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      defaultValue: 'WHO WE ARE',
      label: a('admin.blocks.whoWeAreBlock.subtitleLabel', 'Subtitle'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.subtitleDescription',
          'Small uppercase label displayed above the title',
        ),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.titleLabel', 'Title'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.titleDescription',
          'Main seriffed heading of the section',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.descriptionDescription',
          'Main narrative text explaining who you are',
        ),
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.whoWeAreBlock.imageLabel', 'Image'),
      admin: {
        description: a('admin.blocks.whoWeAreBlock.imageDescription', 'Featured brand image'),
      },
    },
    {
      name: 'pillars',
      type: 'array',
      maxRows: 3,
      label: a('admin.blocks.whoWeAreBlock.pillarsLabel', 'Pillars'),
      labels: {
        singular: a('admin.blocks.whoWeAreBlock.pillarSingular', 'Pillar'),
        plural: a('admin.blocks.whoWeAreBlock.pillarsPlural', 'Pillars'),
      },
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.pillarsDescription',
          'Core values, standards, or highlights (max 3 items)',
        ),
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.whoWeAreBlock.pillarTitleLabel', 'Title'),
          admin: {
            placeholder: a(
              'admin.blocks.whoWeAreBlock.pillarTitlePlaceholder',
              'e.g. Uncompromising Excellence',
            ),
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          label: a('admin.blocks.whoWeAreBlock.pillarDescriptionLabel', 'Description'),
          admin: {
            placeholder: a(
              'admin.blocks.whoWeAreBlock.pillarDescriptionPlaceholder',
              'e.g. We set the standard for quality across all projects.',
            ),
          },
        },
        {
          name: 'icon',
          type: 'select',
          label: a('admin.blocks.whoWeAreBlock.iconLabel', 'Icon'),
          options: [
            { label: a('admin.blocks.whoWeAreBlock.iconStar', 'Star'), value: 'star' },
            { label: a('admin.blocks.whoWeAreBlock.iconHeart', 'Heart'), value: 'heart' },
            { label: a('admin.blocks.whoWeAreBlock.iconShield', 'Shield'), value: 'shield' },
            {
              label: a('admin.blocks.whoWeAreBlock.iconTrendingUp', 'Trending Up'),
              value: 'trending-up',
            },
            { label: a('admin.blocks.whoWeAreBlock.iconAward', 'Award'), value: 'award' },
            { label: a('admin.blocks.whoWeAreBlock.iconEye', 'Eye'), value: 'eye' },
          ],
          defaultValue: 'star',
        },
      ],
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.buttonTextDescription',
          'Text displayed on the call-to-action button',
        ),
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.whoWeAreBlock.ctaLinkLabel', 'Call to Action'),
      },
    }),
  ],
}
