import type { Block } from 'payload'

export const MissionBlock: Block = {
  slug: 'missionBlock',
  interfaceName: 'MissionBlock',
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
      name: 'content',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
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
