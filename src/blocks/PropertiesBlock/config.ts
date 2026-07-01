import type { Block } from 'payload'

export const PropertiesBlock: Block = {
  slug: 'propertiesBlock',
  interfaceName: 'PropertiesBlock',
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
      name: 'backgroundColor',
      type: 'select',
      options: [
        { label: 'Surface (White)', value: 'surface' },
        { label: 'Surface Container Low (Light Grey)', value: 'surface-container-low' },
      ],
      defaultValue: 'surface',
    },
    {
      name: 'showSoldBadge',
      type: 'checkbox',
      label: 'Show SOLD badge on all cards in this block',
      defaultValue: false,
    },
    {
      name: 'dataSource',
      type: 'select',
      label: 'Property Source',
      defaultValue: 'cms',
      options: [
        { label: 'Payload CMS (manual)', value: 'cms' },
        { label: 'CRM API (dynamic)', value: 'crm' },
      ],
    },
    {
      name: 'crmPreset',
      type: 'select',
      label: 'CRM Query Preset',
      defaultValue: 'featured',
      options: [
        { label: 'Featured Properties', value: 'featured' },
        { label: 'Sea View Properties', value: 'seaView' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource === 'crm',
      },
    },
    {
      name: 'crmLimit',
      type: 'number',
      label: 'CRM Result Limit',
      defaultValue: 5,
      min: 1,
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource === 'crm',
      },
    },
    {
      name: 'properties',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource !== 'crm',
      },
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
          localized: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
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
