import type { Block } from 'payload'

export const PropertiesBlock: Block = {
  slug: 'propertiesBlock',
  interfaceName: 'PropertiesBlock',
  fields: [
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'backgroundColor',
      type: 'select',
      options: [
        { label: 'Surface (White)', value: 'surface' },
        { label: 'Surface Container Low (Light Grey)', value: 'surface-container-low' },
      ],
      defaultValue: 'surface',
    },
    {
      name: 'properties',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'isNewListing',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'location',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'beds',
          type: 'number',
          required: true,
        },
        {
          name: 'baths',
          type: 'number',
          required: true,
        },
        {
          name: 'sqft',
          type: 'number',
          required: true,
        },
        {
          name: 'price',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
