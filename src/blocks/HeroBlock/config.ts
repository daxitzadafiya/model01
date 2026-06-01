import type { Block } from 'payload'

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
