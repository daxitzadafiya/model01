import type { Block } from 'payload'

export const InteractiveMapBlock: Block = {
  slug: 'interactiveMapBlock',
  interfaceName: 'InteractiveMapBlock',
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
      name: 'locations',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'offices',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'address',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'mapImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'pins',
      type: 'array',
      fields: [
        {
          name: 'topPercentage',
          type: 'number',
          required: true,
          admin: { description: 'Y position percentage (0-100)' },
        },
        {
          name: 'leftPercentage',
          type: 'number',
          required: true,
          admin: { description: 'X position percentage (0-100)' },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
        },
        {
          name: 'isPulsing',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
