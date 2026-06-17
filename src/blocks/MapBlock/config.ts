import type { Block } from 'payload'

export const MapBlock: Block = {
  slug: 'mapBlock',
  interfaceName: 'MapBlock',
  labels: {
    singular: 'Map',
    plural: 'Maps',
  },
  fields: [
    {
      name: 'center',
      type: 'group',
      label: 'Default map center',
      fields: [
        {
          name: 'lat',
          type: 'number',
          label: 'Latitude',
          defaultValue: 48.9903224,
          required: true,
          admin: {
            step: 0.000001,
          },
        },
        {
          name: 'lng',
          type: 'number',
          label: 'Longitude',
          defaultValue: 12.1991392,
          required: true,
          admin: {
            step: 0.000001,
          },
        },
      ],
    },
    {
      name: 'defaultZoom',
      type: 'number',
      label: 'Default zoom',
      defaultValue: 6,
      min: 1,
      max: 20,
      admin: {
        description: 'Initial zoom level when the map loads.',
      },
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 500,
      admin: {
        description: 'Map height in pixels.',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: 'Map',
      admin: {
        description: 'Accessible title for the map.',
      },
    },
  ],
}
