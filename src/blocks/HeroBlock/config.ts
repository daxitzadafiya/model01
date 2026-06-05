import type { Block } from 'payload'

import { link } from '@/fields/link'

export const HeroBlock: Block = {
  slug: 'heroBlock',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Discover Exceptional Properties in Greece.',
      localized: true,
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      defaultValue: 'View All Properties',
      localized: true,
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'Button Link',
        admin: {
          description: 'Where the hero button navigates to (e.g. Property for Sale page).',
        },
      },
    }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'showSearch',
      type: 'checkbox',
      label: 'Show Floating Search Bar below Hero',
      defaultValue: true,
    },
  ],
}
