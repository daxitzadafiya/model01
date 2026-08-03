import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const PropertyListBlock: Block = {
  slug: 'propertyListBlock',
  interfaceName: 'PropertyListBlock',
  labels: {
    singular: a('admin.blocks.propertyListBlock.singular', 'Property List'),
    plural: a('admin.blocks.propertyListBlock.plural', 'Property Lists'),
  },
  fields: [
    {
      name: 'showBreadcrumb',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showBreadcrumbLabel', 'Show breadcrumb'),
      defaultValue: true,
    },
    {
      name: 'breadcrumbParentLabel',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.breadcrumbParentLabel', 'Breadcrumb parent label'),
      defaultValue: 'Home',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'breadcrumbParentHref',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.breadcrumbParentHrefLabel', 'Breadcrumb parent URL'),
      defaultValue: '/',
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'pageTitle',
      type: 'text',
      label: a(
        'admin.blocks.propertyListBlock.pageTitleLabel',
        'Page heading (optional — use Hero tab if empty)',
      ),
      localized: true,
    },
    {
      name: 'resultsLabel',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.resultsLabel', 'Results count suffix'),
      defaultValue: 'extraordinary properties',
      localized: true,
    },
    {
      name: 'listingPreset',
      type: 'select',
      label: a('admin.blocks.propertyListBlock.listingPresetLabel', 'Property collection'),
      required: true,
      defaultValue: 'forSale',
      options: [
        {
          label: a('admin.blocks.propertyListBlock.listingForSale', 'Property for Sale'),
          value: 'forSale',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingForRent', 'Property for Rent'),
          value: 'forRent',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingForHoliday', 'Holiday Rentals'),
          value: 'forHoliday',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingProjects', 'Projects'),
          value: 'projects',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingFavorites', 'Favorites'),
          value: 'favorites',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingSold', 'Sold Properties'),
          value: 'sold',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingFeatured', 'Featured Properties'),
          value: 'featured',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingSeaView', 'Sea View Properties'),
          value: 'seaView',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingGolf', 'Golf Properties'),
          value: 'golf',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingCustom', 'Custom CRM query'),
          value: 'custom',
        },
      ],
    },
    {
      name: 'pageSize',
      type: 'number',
      label: a('admin.blocks.propertyListBlock.pageSizeLabel', 'Properties per page'),
      defaultValue: 9,
      min: 1,
      max: 48,
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showFiltersLabel', 'Show search filters'),
      defaultValue: true,
    },
    {
      name: 'showMap',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showMapLabel', 'Show map search'),
      defaultValue: false,
      admin: {
        description: a(
          'admin.blocks.propertyListBlock.showMapDescription',
          'Adds a map icon in the filter bar that opens the map modal. For Projects, markers load from constructions with latlng=true (same filters), then area search filters by selected project IDs.',
        ),
        condition: (_, siblingData) => siblingData?.showFilters !== false,
      },
    },
    {
      name: 'forceSoldBadge',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.forceSoldBadgeLabel', 'Show SOLD badge on all cards'),
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'sold',
      },
    },
    {
      name: 'emptyStateNoFavoritesTitle',
      type: 'text',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoFavoritesTitleLabel',
        'Empty state title (no saved favorites)',
      ),
      defaultValue: 'No favorites yet',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
    {
      name: 'emptyStateNoFavoritesDescription',
      type: 'textarea',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoFavoritesDescriptionLabel',
        'Empty state description (no saved favorites)',
      ),
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
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoResultsTitleLabel',
        'Empty state title (filters match nothing)',
      ),
      defaultValue: 'No matching favorites',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
    {
      name: 'emptyStateNoResultsDescription',
      type: 'textarea',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoResultsDescriptionLabel',
        'Empty state description (filters match nothing)',
      ),
      defaultValue:
        'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
      },
    },
  ],
}
