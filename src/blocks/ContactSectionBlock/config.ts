import type { Block } from 'payload'

export const ContactSectionBlock: Block = {
  slug: 'contactSectionBlock',
  interfaceName: 'ContactSectionBlock',
  labels: {
    singular: 'Contact Section',
    plural: 'Contact Sections',
  },
  fields: [
    {
      name: 'formEyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Inquiry',
      admin: {
        description: 'Small uppercase label above the form title (left side).',
      },
    },
    {
      name: 'formTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Private Consultation',
    },
    {
      name: 'formDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Our specialists are dedicated to finding your ideal heritage property. Please share your requirements below.',
    },
    {
      name: 'submitLabelOverride',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional. If empty, submit label from the selected form is used.',
      },
    },
    {
      name: 'formTrustNote',
      type: 'text',
      localized: true,
      defaultValue: "Your information is safe with us. We'll never share your details.",
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enableResubmit',
          type: 'checkbox',
          label: 'Enable re-submit button after success',
          defaultValue: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'resubmitButtonLabel',
          type: 'text',
          localized: true,
          defaultValue: 'Submit another response',
          admin: {
            width: '50%',
            condition: (_, siblingData) => Boolean(siblingData?.enableResubmit),
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'successTitle',
          type: 'text',
          localized: true,
          defaultValue: 'Thank you!',
          admin: {
            width: '50%',
            description: 'Heading shown after successful form submission.',
          },
        },
        {
          name: 'successSubtitle',
          type: 'text',
          localized: true,
          defaultValue: 'Your response has been submitted.',
          admin: {
            width: '50%',
            description: 'Subtext shown below the success title.',
          },
        },
      ],
    },
    {
      name: 'offices',
      type: 'array',
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Headquarters',
        },
        {
          name: 'city',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Athens',
        },
        {
          name: 'addressLines',
          type: 'array',
          minRows: 1,
          fields: [
            {
              name: 'line',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'email',
          type: 'email',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'lat',
              type: 'number',
              admin: {
                width: '50%',
                description: 'Latitude for map marker (e.g. 48.9903224).',
                step: 0.000001,
              },
            },
            {
              name: 'lon',
              type: 'number',
              admin: {
                width: '50%',
                description: 'Longitude for map marker (e.g. 12.1991392).',
                step: 0.000001,
              },
            },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description:
          'Select a form from the Forms collection. Manage fields and submissions under Forms / Form Submissions in admin.',
      },
    },
  ],
}
