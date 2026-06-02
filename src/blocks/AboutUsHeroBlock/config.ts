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
      localized: true,
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
      localized: true,
      admin: {
        description: 'Large serif headline (line breaks are preserved)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
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
  ],
}
