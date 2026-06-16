import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
} from '@/email/forgotPasswordEmail'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) =>
          Boolean(user?.collection === 'users' && user.roles.includes('admin')),
      },
    },
  ],
  timestamps: true,
}
