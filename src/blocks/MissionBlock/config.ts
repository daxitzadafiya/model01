import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const MissionBlock: Block = {
  slug: 'missionBlock',
  interfaceName: 'MissionBlock',
  labels: {
    singular: a('admin.blocks.missionBlock.singular', 'Mission Block'),
    plural: a('admin.blocks.missionBlock.plural', 'Mission Blocks'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.missionBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.missionBlock.titleLabel', 'Title'),
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.missionBlock.contentLabel', 'Content'),
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      label: a('admin.blocks.missionBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.missionBlock.buttonTextDescription',
          'Text displayed on the call-to-action button',
        ),
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.missionBlock.ctaLinkLabel', 'Button Link'),
      },
    }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.missionBlock.imageLabel', 'Image'),
    },
    {
      name: 'establishedYear',
      type: 'text',
      label: a('admin.blocks.missionBlock.establishedYearLabel', 'Established Year'),
    },
  ],
}
