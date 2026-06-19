import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            {
              name: 'tagline',
              type: 'textarea',
              localized: true,
              defaultValue:
                'Elevating the Greek real estate experience through heritage, transparency, and architectural excellence.',
              admin: {
                description: 'Short description shown below the logo.',
              },
            },
            {
              name: 'socialLinks',
              type: 'array',
              maxRows: 6,
              admin: {
                description: 'Social or external links shown as icons. you can use from https://react-icons.github.io/react-icons/icons/fi/',
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/SocialRowLabel#SocialRowLabel',
                },
              },
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'icon name (e.g. FiPhone, FiMail, FiMapPin). you can use from https://react-icons.github.io/react-icons/icons/fi/',
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'newTab',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Open in new tab',
                },
              ],
            },
          ],
        },
        {
          label: 'Quick Links',
          fields: [
            {
              name: 'quickLinksTitle',
              type: 'text',
              localized: true,
              defaultValue: 'QUICK LINKS',
            },
            {
              name: 'navItems',
              type: 'array',
              localized: true,
              fields: [
                link({
                  appearances: false,
                }),
              ],
              maxRows: 6,
              admin: {
                description:
                  'Footer links for the current locale (switch locale in the admin bar to edit each language).',
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/RowLabel#RowLabel',
                },
              },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contactTitle',
              type: 'text',
              localized: true,
              defaultValue: 'CONTACT US',
            },
            {
              name: 'contact',
              type: 'group',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  defaultValue: '+30 210 3388 000',
                },
                {
                  name: 'email',
                  type: 'email',
                  defaultValue: 'info@horizonestates.com',
                },
                {
                  name: 'address',
                  type: 'textarea',
                  localized: true,
                  defaultValue: 'Skoufa 12, Athens',
                },
              ],
            },
          ],
        },
        {
          label: 'Certifications',
          fields: [
            {
              name: 'certificationsTitle',
              type: 'text',
              localized: true,
              defaultValue: 'CERTIFICATIONS',
            },
            {
              name: 'certifications',
              type: 'array',
              maxRows: 6,
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/CertificationRowLabel#CertificationRowLabel',
                },
              },
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'react icon name (e.g. FiPhone, FiMail, FiMapPin). You can use from https://react-icons.github.io/react-icons/icons/fi/',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Bottom Bar',
          fields: [
            {
              name: 'copyrightText',
              type: 'text',
              localized: true,
              defaultValue: 'ALL RIGHTS RESERVED.',
              admin: {
                description:
                  'Localized “all rights reserved” phrase only. The footer adds ©, year, and app name from Logo → App Name automatically.',
              },
            },
            {
              name: 'legalLinks',
              type: 'array',
              localized: true,
              fields: [
                link({
                  appearances: false,
                }),
              ],
              maxRows: 8,
              admin: {
                description: 'Legal and policy links shown in the bottom bar.',
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/LegalRowLabel#LegalRowLabel',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
