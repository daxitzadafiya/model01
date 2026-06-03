import type { Block } from 'payload'

export const PropertyListBlock: Block = {
  slug: 'propertyListBlock',
  interfaceName: 'PropertyListBlock',
  labels: {
    singular: 'Property List',
    plural: 'Property Lists',
  },
  fields: [
    {
      name: 'showBreadcrumb',
      type: 'checkbox',
      label: 'Show breadcrumb',
      defaultValue: true,
    },
    {
      name: 'breadcrumbParentLabel',
      type: 'text',
      label: 'Breadcrumb parent label',
      defaultValue: 'Home',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'breadcrumbParentHref',
      type: 'text',
      label: 'Breadcrumb parent URL',
      defaultValue: '/',
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'pageTitle',
      type: 'text',
      label: 'Page heading (optional — use Hero tab if empty)',
      localized: true,
    },
    {
      name: 'resultsLabel',
      type: 'text',
      label: 'Results count suffix',
      defaultValue: 'extraordinary properties',
      localized: true,
    },
    {
      name: 'listingPreset',
      type: 'select',
      label: 'Property collection',
      required: true,
      defaultValue: 'forSale',
      options: [
        { label: 'Property for Sale', value: 'forSale' },
        { label: 'Sold Properties', value: 'sold' },
        { label: 'Featured Properties', value: 'featured' },
        { label: 'Sea View Properties', value: 'seaView' },
        { label: 'Custom Query JSON', value: 'custom' },
      ],
    },
    {
      name: 'crmQueryJson',
      type: 'textarea',
      label: 'CRM Custom Query (JSON)',
      admin: {
        description:
          'Used when "Property collection" is Custom Query JSON. Paste the query object or full payload. MongoDB operators must be valid JSON, e.g. "archived": {"$ne": true}. You can also paste {$ne: true} — it will be auto-fixed.',
        condition: (_, siblingData) => siblingData?.listingPreset === 'custom',
      },
    },
    {
      name: 'pageSize',
      type: 'number',
      label: 'Properties per page',
      defaultValue: 9,
      min: 1,
      max: 48,
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      label: 'Show search filters',
      defaultValue: true,
    },
    {
      name: 'mapSearchUrl',
      type: 'text',
      label: 'Search By Map URL',
      admin: {
        description: 'Link for the full-width "Search By Map" button.',
        condition: (_, siblingData) => siblingData?.showFilters !== false,
      },
    },
    {
      name: 'forceSoldBadge',
      type: 'checkbox',
      label: 'Show SOLD badge on all cards',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'sold',
      },
    },
  ],
}
