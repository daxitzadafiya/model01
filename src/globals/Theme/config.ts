import type { GlobalConfig } from 'payload'

export const Theme: GlobalConfig = {
  slug: 'theme',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'colors',
      type: 'group',
      fields: [
        {
          name: 'primary',
          type: 'text',
          defaultValue: '#000000',
          required: true,
          admin: {
            description: 'Main brand color (e.g., #000000)',
          },
        },
        {
          name: 'secondary',
          type: 'text',
          defaultValue: '#5e5e5c',
          required: true,
          admin: {
            description: 'Secondary brand color (e.g., #5e5e5c)',
          },
        },
        {
          name: 'tertiary',
          type: 'text',
          defaultValue: '#755b00',
          required: true,
          admin: {
            description: 'Accent color (e.g., #755b00)',
          },
        },
        {
          name: 'surface',
          type: 'text',
          defaultValue: '#fef9f1',
          required: true,
          admin: {
            description: 'Main background surface color (e.g., #fef9f1)',
          },
        },
        {
          name: 'background',
          type: 'text',
          defaultValue: '#fef9f1',
          required: true,
          admin: {
            description: 'General background color (e.g., #fef9f1)',
          },
        },
      ],
    },
  ],
}
