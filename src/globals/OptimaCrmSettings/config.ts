import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { invalidateOptimaCrmSettingsCache } from '@/settings/optimaCrm/client'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const OptimaCrmSettings: GlobalConfig = {
  slug: 'optimaCrmSettings',
  label: 'Optima CRM',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'Optima CRM API credentials, contact endpoint, and image CDN settings. Stored in the database — not in environment variables.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'api',
      type: 'group',
      label: 'API credentials',
      fields: [
        {
          name: 'apiUrl',
          type: 'text',
          label: 'CRM API URL (v3)',
          required: true,
          admin: {
            description: 'Base URL for Optima v3 API (e.g. https://your-crm.optima-crm.com/v3).',
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          label: 'CRM API key',
          required: true,
          admin: {
            description: 'Sent as user_apikey on CRM requests.',
          },
        },
        {
          name: 'contactUrl',
          type: 'text',
          label: 'Contact form URL (Yii)',
          required: true,
          admin: {
            description:
              'Yii endpoint for contact submissions and PDF brochures (?r=accounts/index or ?r=pdf).',
          },
        },
        {
          name: 'userKey',
          type: 'text',
          label: 'Optima user key',
          required: true,
          admin: {
            description: 'Used for property detail view and PDF brochure generation.',
          },
        },
        {
          name: 'brochureTemplateId',
          type: 'number',
          label: 'Brochure template ID',
          defaultValue: 39,
          required: true,
          admin: {
            description: 'Optima PDF template ID for property brochures.',
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'group',
      label: 'Image CDN',
      required: true,
      admin: {
        description: 'Optima image URL bases. Defaults match the standard Optima CDN if left empty.',
      },
      fields: [
        {
          name: 'imageUrlWithoutResize',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/cms_medias/',
        },
        {
          name: 'imageUrl',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/resize/cms_medias/',
        },
        {
          name: 'commercialImageBase',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/commercial_images',
        },
        {
          name: 'agencyId',
          type: 'text',
          required: true,
          admin: {
            description: 'Optima agency ID for commercial images.',
          },
        },
        {
          name: 'propertyResizeBase',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/resize/commercial_images/',
        },
        {
          name: 'siteId',
          type: 'text',
          required: true,
          defaultValue: '237',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateOptimaCrmSettingsCache()
        await revalidateCacheTag('global_optimaCrmSettings')
      },
    ],
  },
}
