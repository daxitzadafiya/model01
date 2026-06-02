import type { Block } from 'payload'

export const CertificatesBlock: Block = {
  slug: 'certificatesBlock',
  interfaceName: 'CertificatesBlock',
  labels: {
    singular: 'Certificates Section',
    plural: 'Certificates Sections',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Small label above the section title.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'certificates',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
}
