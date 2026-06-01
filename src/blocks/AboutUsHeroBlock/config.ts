import type { Block } from 'payload'

export const AboutUsHeroBlock: Block = {
  slug: 'aboutUsHeroBlock',
  interfaceName: 'AboutUsHeroBlock',
  labels: {
    singular: 'About Us Hero',
    plural: 'About Us Hero Sections',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      defaultValue: 'About Us',
      admin: {
        description: 'Small label above the headline',
      },
    },
    {
      name: 'headline',
      type: 'textarea',
      required: true,
      defaultValue: "We don't just sell properties. We help you find home.",
      admin: {
        description: 'Large serif headline (line breaks are preserved)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue:
        'A full-service real estate company dedicated to helping clients confidently find, buy, sell, and invest in exceptional properties.',
      admin: {
        description: 'Supporting paragraph below the headline',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Full-width background photograph',
      },
    },
    {
      name: 'height',
      type: 'select',
      defaultValue: 'large',
      options: [
        { label: 'Compact (60vh)', value: 'compact' },
        { label: 'Large (85vh)', value: 'large' },
        { label: 'Full screen', value: 'fullscreen' },
      ],
      admin: {
        description: 'Section height on desktop',
      },
    },
  ],
}
