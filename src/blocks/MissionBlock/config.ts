import type { Block } from 'payload'

export const MissionBlock: Block = {
  slug: 'missionBlock',
  interfaceName: 'MissionBlock',
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
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'buttonText',
      type: 'text',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'establishedYear',
      type: 'text',
    },
  ],
}
