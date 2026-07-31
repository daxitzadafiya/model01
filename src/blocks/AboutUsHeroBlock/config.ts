import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const AboutUsHeroBlock: Block = {
  slug: 'aboutUsHeroBlock',
  interfaceName: 'AboutUsHeroBlock',
  labels: {
    singular: a('admin.blocks.aboutUsHeroBlock.singular', 'About Us Hero'),
    plural: a('admin.blocks.aboutUsHeroBlock.plural', 'About Us Hero Sections'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      defaultValue: 'About Us',
      label: a('admin.blocks.aboutUsHeroBlock.labelLabel', 'Label'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.labelDescription',
          'Small label above the headline',
        ),
      },
    },
    {
      name: 'headline',
      type: 'textarea',
      required: true,
      defaultValue: "We don't just sell properties. We help you find home.",
      localized: true,
      label: a('admin.blocks.aboutUsHeroBlock.headlineLabel', 'Headline'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.headlineDescription',
          'Large serif headline (line breaks are preserved)',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'A full-service real estate company dedicated to helping clients confidently find, buy, sell, and invest in exceptional properties.',
      label: a('admin.blocks.aboutUsHeroBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.descriptionDescription',
          'Supporting paragraph below the headline',
        ),
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.aboutUsHeroBlock.backgroundImageLabel', 'Background Image'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.backgroundImageDescription',
          'Full-width background photograph',
        ),
      },
    },
  ],
}
