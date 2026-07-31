import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const FounderSpotlightBlock: Block = {
  slug: 'founderSpotlightBlock',
  interfaceName: 'FounderSpotlightBlock',
  labels: {
    singular: a('admin.blocks.founderSpotlightBlock.singular', 'Founder Spotlight'),
    plural: a('admin.blocks.founderSpotlightBlock.plural', 'Founder Spotlights'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'FOUNDER SPOTLIGHT',
      label: a('admin.blocks.founderSpotlightBlock.subtitleLabel', 'Subtitle'),
      admin: {
        description: a(
          'admin.blocks.founderSpotlightBlock.subtitleDescription',
          'Small label above the founder name',
        ),
      },
      localized: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.founderSpotlightBlock.nameLabel', 'Name'),
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      label: a('admin.blocks.founderSpotlightBlock.roleLabel', 'Role'),
      admin: {
        description: a(
          'admin.blocks.founderSpotlightBlock.roleDescription',
          'e.g. Founder & Managing Director',
        ),
      },
      localized: true,
    },
    {
      name: 'quote',
      type: 'textarea',
      label: a('admin.blocks.founderSpotlightBlock.quoteLabel', 'Quote'),
      admin: {
        description: a(
          'admin.blocks.founderSpotlightBlock.quoteDescription',
          'Optional pull quote displayed prominently',
        ),
      },
      localized: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.founderSpotlightBlock.bioLabel', 'Bio'),
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.founderSpotlightBlock.portraitLabel', 'Portrait'),
    },
    {
      name: 'highlights',
      type: 'array',
      label: a('admin.blocks.founderSpotlightBlock.highlightsLabel', 'Highlights'),
      labels: {
        singular: a('admin.blocks.founderSpotlightBlock.highlightSingular', 'Highlight'),
        plural: a('admin.blocks.founderSpotlightBlock.highlightsPlural', 'Highlights'),
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.founderSpotlightBlock.highlightValueLabel', 'Value'),
          admin: {
            description: a('admin.blocks.founderSpotlightBlock.highlightValueDescription', 'e.g. 25+'),
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.founderSpotlightBlock.highlightLabelLabel', 'Label'),
          admin: {
            description: a(
              'admin.blocks.founderSpotlightBlock.highlightLabelDescription',
              'e.g. Years of Excellence',
            ),
          },
        },
      ],
    },
  ],
}
