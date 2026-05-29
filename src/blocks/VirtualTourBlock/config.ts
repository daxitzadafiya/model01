import type { Block } from 'payload'

import { link } from '@/fields/link'

export const VirtualTourBlock: Block = {
  slug: 'virtualTourBlock',
  dbName: 'vtour',
  interfaceName: 'VirtualTourBlock',
  labels: {
    singular: 'Virtual Tour CTA',
    plural: 'Virtual Tour CTAs',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Step Inside Your Future Home from Anywhere in the World.',
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      defaultValue: 'EXPLORE NOW',
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'Button Link',
      },
    }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
