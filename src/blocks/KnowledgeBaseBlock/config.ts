import type { Block } from 'payload'

export const KnowledgeBaseBlock: Block = {
  slug: 'knowledgeBaseBlock',
  dbName: 'kb',
  interfaceName: 'KnowledgeBaseBlock',
  labels: {
    singular: 'Knowledge Base',
    plural: 'Knowledge Base',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'KNOWLEDGE BASE',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Latest News',
      localized: true,
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Latest from Posts', value: 'collection' },
        { label: 'Select Posts', value: 'selection' },
        { label: 'Manual entries', value: 'manual' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'collection',
      },
    },
    {
      name: 'selectedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'selection',
      },
    },
    {
      name: 'articles',
      type: 'array',
      dbName: 'arts',
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'manual',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'category',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'Article URL',
          admin: {
            description: 'Path (e.g. /posts/my-article) or full URL',
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          defaultValue: false,
        },
      ],
    },
  ],
}
