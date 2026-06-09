import type { GlobalConfig } from 'payload'

import { revalidatePropertyMap } from './hooks/revalidatePropertyMap'

export const PropertyMap: GlobalConfig = {
  slug: 'propertyMap',
  label: 'Property Map',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Default map center, zoom, and cluster styling for the property search map modal.',
  },
  hooks: {
    afterChange: [revalidatePropertyMap],
  },
  fields: [
    {
      name: 'modalTitle',
      type: 'text',
      label: 'Modal title',
      defaultValue: 'Property Map',
      localized: true,
    },
    {
      name: 'defaultCenter',
      type: 'group',
      label: 'Default map center',
      fields: [
        {
          name: 'lat',
          type: 'number',
          label: 'Latitude',
          defaultValue: 38.3452,
          required: true,
        },
        {
          name: 'lng',
          type: 'number',
          label: 'Longitude',
          defaultValue: -0.481,
          required: true,
        },
      ],
    },
    {
      name: 'defaultZoom',
      type: 'number',
      label: 'Default zoom',
      defaultValue: 8,
      min: 1,
      max: 20,
      required: true,
    },
    {
      name: 'minZoom',
      type: 'number',
      label: 'Minimum zoom',
      defaultValue: 5,
      min: 1,
      max: 20,
    },
    {
      name: 'maxZoom',
      type: 'number',
      label: 'Maximum zoom',
      defaultValue: 18,
      min: 1,
      max: 20,
    },
    {
      name: 'enableDrawSearch',
      type: 'checkbox',
      label: 'Enable draw-to-search',
      defaultValue: true,
    },
    {
      name: 'drawInstructionText',
      type: 'text',
      label: 'Draw instruction text',
      defaultValue: 'Draw A Shape Around The Region(S) You Would Like To Search',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.enableDrawSearch !== false,
      },
    },
    {
      name: 'drawButtonLabel',
      type: 'text',
      label: 'Draw button label',
      defaultValue: 'Draw your area on the map',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.enableDrawSearch !== false,
      },
    },
    {
      name: 'clusterColors',
      type: 'group',
      label: 'Cluster colors',
      fields: [
        {
          name: 'small',
          type: 'text',
          label: 'Small cluster',
          defaultValue: '#5e5e5c',
        },
        {
          name: 'medium',
          type: 'text',
          label: 'Medium cluster',
          defaultValue: '#755b00',
        },
        {
          name: 'large',
          type: 'text',
          label: 'Large cluster',
          defaultValue: '#000000',
        },
      ],
    },
    {
      name: 'mapFetchLimit',
      type: 'number',
      label: 'Map fetch page size',
      defaultValue: 10,
      min: 1,
      max: 100,
      admin: {
        description: 'Number of properties requested per CRM page when loading map markers.',
      },
    },
  ],
}
