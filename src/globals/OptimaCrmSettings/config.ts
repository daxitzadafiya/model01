import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { invalidateOptimaCrmSettingsCache } from '@/settings/optimaCrm/client'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const OptimaCrmSettings: GlobalConfig = {
  slug: 'optimaCrmSettings',
  // Shorten versioned table/enum identifiers (SQLite 63-char limit).
  dbName: 'optima_crm',
  label: a('admin.optimaCrmSettings.label', 'Optima CRM'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.optimaCrmSettings.description',
      'Optima CRM API credentials, contact endpoint, and image CDN settings. Stored in the database — not in environment variables.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'api',
      type: 'group',
      label: a('admin.optimaCrmSettings.api', 'API credentials'),
      fields: [
        {
          name: 'apiUrl',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.apiUrl', 'CRM API URL (v3)'),
          required: true,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.apiUrl.description',
              'Base URL for Optima v3 API (e.g. https://your-crm.optima-crm.com/v3).',
            ),
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.apiKey', 'CRM API key'),
          required: true,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.apiKey.description',
              'Sent as user_apikey on CRM requests.',
            ),
          },
        },
        {
          name: 'contactUrl',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.contactUrl', 'Contact form URL (Yii)'),
          required: true,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.contactUrl.description',
              'Yii endpoint for contact submissions and PDF brochures (?r=accounts/index or ?r=pdf).',
            ),
          },
        },
        {
          name: 'userKey',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.userKey', 'Optima user key'),
          required: true,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.userKey.description',
              'Used for property detail view and PDF brochure generation.',
            ),
          },
        },
        {
          name: 'brochureTemplateId',
          type: 'number',
          label: a('admin.optimaCrmSettings.api.brochureTemplateId', 'Brochure template ID'),
          defaultValue: 39,
          required: true,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.brochureTemplateId.description',
              'Optima PDF template ID for property brochures.',
            ),
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'group',
      label: a('admin.optimaCrmSettings.images', 'Image CDN'),
      required: true,
      admin: {
        description: a(
          'admin.optimaCrmSettings.images.description',
          'Optima image URL bases. Defaults match the standard Optima CDN if left empty.',
        ),
      },
      fields: [
        {
          name: 'imageUrlWithoutResize',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/cms_medias/',
          label: a('admin.optimaCrmSettings.images.imageUrlWithoutResize', 'Image URL Without Resize'),
        },
        {
          name: 'imageUrl',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/resize/cms_medias/',
          label: a('admin.optimaCrmSettings.images.imageUrl', 'Image URL'),
        },
        {
          name: 'commercialImageBase',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/commercial_images',
          label: a('admin.optimaCrmSettings.images.commercialImageBase', 'Commercial Image Base'),
        },
        {
          name: 'constructionsImageBase',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/constructions_images',
          label: a('admin.optimaCrmSettings.images.constructionsImageBase', 'Constructions Image Base'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.images.constructionsImageBase.description',
              'Base URL for construction/project document files.',
            ),
          },
        },
        {
          name: 'agencyId',
          type: 'text',
          required: true,
          label: a('admin.optimaCrmSettings.images.agencyId', 'Agency ID'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.images.agencyId.description',
              'Optima agency ID for commercial images.',
            ),
          },
        },
        {
          name: 'propertyResizeBase',
          type: 'text',
          required: true,
          defaultValue: 'https://images.optima-crm.com/resize/',
          label: a('admin.optimaCrmSettings.images.propertyResizeBase', 'Property Resize Base'),
        },
        {
          name: 'siteId',
          type: 'text',
          required: true,
          defaultValue: '237',
          label: a('admin.optimaCrmSettings.images.siteId', 'Site ID'),
        },
      ],
    },
    {
      name: 'properties',
      type: 'group',
      label: a('admin.optimaCrmSettings.properties', 'Property queries'),
      fields: [
        {
          name: 'similarCommercials',
          dbName: 'simCom',
          type: 'select',
          label: a('admin.optimaCrmSettings.properties.similarCommercials', 'Similar commercials'),
          defaultValue: 'exclude_similar',
          required: true,
          options: [
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.excludeSimilar',
                'Exclude similar',
              ),
              value: 'exclude_similar',
            },
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.includeSimilar',
                'Include similar',
              ),
              value: 'include_similar',
            },
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.onlySimilar',
                'Only similar',
              ),
              value: 'only_similar',
            },
          ],
          admin: {
            description: a(
              'admin.optimaCrmSettings.properties.similarCommercials.description',
              'Controls the similar_commercials parameter on all CRM property listing requests.',
            ),
          },
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
