import type { Block } from 'payload'

export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  interfaceName: 'TestimonialsBlock',
  labels: {
    singular: 'Testimonials',
    plural: 'Testimonials',
  },
  fields: [
    {
      name: 'testimonials',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          required: true,
          localized: true,
        },
        {
          name: 'authorName',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'authorRole',
          type: 'text',
          admin: {
            description: 'Optional title or location',
          },
        },
      ],
    },
  ],
}
