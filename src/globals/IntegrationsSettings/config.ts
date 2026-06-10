import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { invalidateIntegrationsSettingsCache } from '@/settings/integrations/client'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const IntegrationsSettings: GlobalConfig = {
  slug: 'integrationsSettings',
  label: 'Integrations',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'Third-party integration keys for Google Maps and reCAPTCHA. Stored in the database — not in environment variables.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'googleMaps',
      type: 'group',
      label: 'Google Maps',
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          label: 'Maps API key',
          admin: {
            description: 'Used by the property search map modal.',
          },
        },
      ],
    },
    {
      name: 'recaptcha',
      type: 'group',
      label: 'reCAPTCHA',
      fields: [
        {
          name: 'siteKey',
          type: 'text',
          label: 'Site key',
          required: true,
          admin: {
            description: 'Public key shown in the contact form widget.',
          },
        },
        {
          name: 'secretKey',
          type: 'text',
          label: 'Secret key',
          required: true,
          admin: {
            description: 'Server-side key for verifying form submissions.',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateIntegrationsSettingsCache()
        await revalidateCacheTag('global_integrationsSettings')
      },
    ],
  },
}
