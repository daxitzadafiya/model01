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
      name: 'mapUrl',
      type: 'text',
      required: true,
      defaultValue: 'https://maps.google.com',
      admin: {
        description:
          'Google Maps embed URL. In Google Maps: Share → Embed a map → copy the src value from the iframe code.',
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
        description: 'Accessible title for the embedded map.',
      },
    },
  ],
}
