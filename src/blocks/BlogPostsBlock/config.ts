import type { Block } from 'payload'

import { link } from '@/fields/link'

export const BlogPostsBlock: Block = {
  slug: 'blogPostsBlock',
  dbName: 'blog',
  interfaceName: 'BlogPostsBlock',
  labels: {
    singular: 'Blog Posts',
    plural: 'Blog Posts',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional label above the heading.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Blog',
      localized: true,
    },
    {
      name: 'postsPerPage',
      type: 'number',
      defaultValue: 9,
      min: 1,
      max: 24,
      label: 'Posts Per Page',
    },
    {
      type: 'collapsible',
      label: 'Empty State',
      admin: {
        initCollapsed: true,
        description: 'Shown when there are no published posts to display.',
      },
      fields: [
        {
          name: 'emptyStateEyebrow',
          type: 'text',
          label: 'Eyebrow',
          defaultValue: 'No Results',
          localized: true,
        },
        {
          name: 'emptyStateTitle',
          type: 'text',
          label: 'Title',
          defaultValue: 'No posts found',
          localized: true,
        },
        {
          name: 'emptyStateDescription',
          type: 'textarea',
          label: 'Description',
          defaultValue: 'There are no articles published yet. Please check back soon for new content.',
          localized: true,
        },
        link({
          appearances: false,
          overrides: {
            name: 'emptyStateLink',
            label: 'Call to Action (optional)',
            dbName: 'es_lnk',
            admin: {
              description: 'Optional button below the empty state message.',
            },
          },
        }),
      ],
    },
  ],
}
