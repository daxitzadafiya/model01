import type { Block } from 'payload'

export const AdvisorsBlock: Block = {
  slug: 'advisorsBlock',
  interfaceName: 'AdvisorsBlock',
  labels: {
    singular: 'Advisors',
    plural: 'Advisors',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'MEET OUR TEAM',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Meet Our Distinguished Agents',
      localized: true,
    },
    {
      name: 'advisors',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'role',
          type: 'text',
          required: true,
          localized: true,
          label: 'Title / Role',
          admin: {
            description: 'e.g. Founder & Managing Director',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Short biography shown below the title',
          },
        },
      ],
    },
  ],
}
