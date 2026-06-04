import type { Block } from 'payload'

import { link } from '@/fields/link'

export const MissionBlock: Block = {
  slug: 'missionBlock',
  interfaceName: 'MissionBlock',
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      admin: {
        description: 'Text displayed on the call-to-action button',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'Button Link',
      },
    }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'establishedYear',
      type: 'text',
    },
  ],
}
