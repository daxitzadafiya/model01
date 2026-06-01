import type { Block } from 'payload'

export const FounderSpotlightBlock: Block = {
  slug: 'founderSpotlightBlock',
  interfaceName: 'FounderSpotlightBlock',
  labels: {
    singular: 'Founder Spotlight',
    plural: 'Founder Spotlights',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'FOUNDER SPOTLIGHT',
      admin: {
        description: 'Small label above the founder name',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. Founder & Managing Director',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      admin: {
        description: 'Optional pull quote displayed prominently',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'highlights',
      type: 'array',
      maxRows: 4,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. 25+',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. Years of Excellence',
          },
        },
      ],
    },
  ],
}
