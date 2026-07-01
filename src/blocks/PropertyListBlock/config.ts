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
        { label: 'Property for Rent', value: 'forRent' },
        { label: 'Favorites', value: 'favorites' },
        { label: 'Sold Properties', value: 'sold' },
        { label: 'Featured Properties', value: 'featured' },
        { label: 'Sea View Properties', value: 'seaView' },
      ],
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
      name: 'showMap',
      type: 'checkbox',
      label: 'Show map search',
      defaultValue: false,
      admin: {
        description: 'Adds a map icon in the filter bar that opens the property map modal.',
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
    {
      name: 'emptyStateNoFavoritesTitle',
      type: 'text',
      label: 'Empty state title (no saved favorites)',
      defaultValue: 'No favorites yet',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
    {
      name: 'emptyStateNoFavoritesDescription',
      type: 'textarea',
      label: 'Empty state description (no saved favorites)',
      defaultValue:
        "You haven't favorited any properties yet. Browse our listings and tap the heart on any property to save it here.",
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
    {
      name: 'emptyStateNoResultsTitle',
      type: 'text',
      label: 'Empty state title (filters match nothing)',
      defaultValue: 'No matching favorites',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
    {
      name: 'emptyStateNoResultsDescription',
      type: 'textarea',
      label: 'Empty state description (filters match nothing)',
      defaultValue:
        'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
  ],
}
