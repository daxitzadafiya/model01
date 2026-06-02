import type { GlobalConfig } from 'payload'

import { revalidateLogo } from './hooks/revalidateLogo'

export const SiteLogo: GlobalConfig = {
  slug: 'logo',
  label: 'Logo',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Site logos used in the header, footer, and admin panel.',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      defaultValue: 'Roumpos',
      required: true,
      admin: {
        description: 'Alternative text for accessibility.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lightLogo',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: {
            width: '50%',
            description: 'Logo for light backgrounds (e.g. header). Falls back to /logo.png.',
          },
        },
        {
          name: 'darkLogo',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: {
            width: '50%',
            description: 'Logo for dark backgrounds (e.g. footer). Falls back to /logow.png.',
          },
        },
      ],
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description:
          'Favicon used in browser tabs for both frontend and admin. Falls back to /favicon.ico.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateLogo],
  },
}
