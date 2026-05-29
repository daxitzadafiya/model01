import type { Block, Field } from 'payload'

import { link } from '@/fields/link'

const panelFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'description',
    type: 'textarea',
    required: true,
  },
  {
    name: 'buttonText',
    type: 'text',
    required: true,
  },
  link({
    appearances: false,
    overrides: {
      name: 'panelLink',
      label: 'Button Link',
    },
  }),
]

export const DualActionBlock: Block = {
  slug: 'dualActionBlock',
  dbName: 'dual',
  interfaceName: 'DualActionBlock',
  labels: {
    singular: 'Dual Action CTA',
    plural: 'Dual Action CTAs',
  },
  fields: [
    {
      name: 'assignPanel',
      type: 'group',
      label: 'Assign Your Property (left)',
      fields: panelFields,
    },
    {
      name: 'searchPanel',
      type: 'group',
      label: 'Request a Search (right)',
      fields: panelFields,
    },
  ],
}
