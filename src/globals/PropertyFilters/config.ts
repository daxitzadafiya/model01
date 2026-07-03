import type { ArrayField, Field, GlobalConfig } from 'payload'

import { revalidatePropertyFilters } from './hooks/revalidatePropertyFilters'

const COL_THIRD = '33.33%' as const
const COL_HALF = '50%' as const

const sortOptionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        required: true,
        admin: {
          width: '30%',
          description: 'Unique key for this sort option.',
        },
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        required: true,
        localized: true,
        admin: {
          width: '30%',
        },
      },
      {
        name: 'sortParams',
        type: 'textarea',
        label: 'CRM sort parameters',
        required: true,
        admin: {
          width: '40%',
          description:
            'JSON merged into options.sort (e.g. {"created_at": -1}, {"current_price": 1}, {"updated_at": true}).',
        },
      },
    ],
  },
]

const filterOptionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        required: true,
        admin: {
          width: '40%',
          description: 'CRM filter value sent with the search query.',
        },
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        required: true,
        localized: true,
        admin: {
          width: '60%',
        },
      },
    ],
  },
]

const priceRangeFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        required: true,
        admin: {
          width: '25%',
          description: 'Unique key (e.g. 500k-1m).',
        },
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        required: true,
        localized: true,
        admin: {
          width: '25%',
        },
      },
      {
        name: 'min',
        type: 'text',
        label: 'Min price',
        required: true,
        admin: {
          width: '25%',
          description: 'CRM value or "any".',
        },
      },
      {
        name: 'max',
        type: 'text',
        label: 'Max price',
        required: true,
        admin: {
          width: '25%',
          description: 'CRM value or "any".',
        },
      },
    ],
  },
]

function filterArrayField(
  config: Omit<ArrayField, 'type' | 'admin'> & {
    admin?: ArrayField['admin'] & { width?: string }
  },
): ArrayField {
  const { admin, ...field } = config

  return {
    ...field,
    type: 'array',
    admin: {
      initCollapsed: true,
      ...admin,
    },
  }
}

export const PropertyFilters: GlobalConfig = {
  slug: 'propertyFilters',
  label: 'Property Filters',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Dropdown options for property search filters and sort order. Property type and location still come from the CRM API.',
  },
  hooks: {
    afterChange: [revalidatePropertyFilters],
  },
  fields: [
    filterArrayField({
      name: 'sortOptions',
      label: 'Sort options',
      admin: {
        width: '100%',
        initCollapsed: false,
        description: 'Options for the property list “Sort by” dropdown. Each row maps to CRM options.sort.',
      },
      defaultValue: [
        { value: 'recent', label: 'Recent', sortParams: '{"created_at": -1}' },
        { value: 'relevance', label: 'Relevance', sortParams: '{"featured": -1}' },
        { value: 'priceAsc', label: 'Lowest Price', sortParams: '{"current_price": 1}' },
        { value: 'priceDesc', label: 'Highest Price', sortParams: '{"current_price": -1}' },
      ],
      fields: sortOptionFields,
    }),
    filterArrayField({
      name: 'priceRanges',
      label: 'Price ranges',
      admin: {
        width: '100%',
        initCollapsed: false,
        description: 'Used in the main filter bar and hero search.',
      },
      defaultValue: [
        { value: 'any', label: 'Any Price', min: 'any', max: 'any' },
        { value: '500k-1m', label: '€500k - €1M', min: '500000', max: '1000000' },
        { value: '1m-3m', label: '€1M - €3M', min: '1000000', max: '3000000' },
        { value: '3m-10m', label: '€3M - €10M', min: '3000000', max: '10000000' },
        { value: '10m+', label: '€10M+', min: '10000000', max: 'any' },
      ],
      fields: priceRangeFields,
    }),
    {
      type: 'row',
      fields: [
        filterArrayField({
          name: 'bedrooms',
          label: 'Bedrooms',
          admin: {
            width: COL_HALF,
            description: 'Exact bedroom counts. Use value "other" for the custom-number option.',
          },
          defaultValue: [
            { value: 'any', label: 'Any Bedrooms' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: 'other', label: 'Need More' },
          ],
          fields: filterOptionFields,
        }),
        filterArrayField({
          name: 'bathrooms',
          label: 'Bathrooms',
          admin: {
            width: COL_HALF,
            description: 'Exact bathroom counts. Use value "other" for the custom-number option.',
          },
          defaultValue: [
            { value: 'any', label: 'Any Bathrooms' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: 'other', label: 'Need More' },
          ],
          fields: filterOptionFields,
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        filterArrayField({
          name: 'minPrices',
          label: 'Min price',
          admin: { width: COL_HALF },
          defaultValue: [
            { value: 'any', label: 'Any Min Price' },
            { value: '500000', label: '€500,000' },
            { value: '1000000', label: '€1,000,000' },
            { value: '3000000', label: '€3,000,000' },
            { value: '10000000', label: '€10,000,000' },
          ],
          fields: filterOptionFields,
        }),
        filterArrayField({
          name: 'maxPrices',
          label: 'Max price',
          admin: { width: COL_HALF },
          defaultValue: [
            { value: 'any', label: 'Any Max Price' },
            { value: '1000000', label: '€1,000,000' },
            { value: '3000000', label: '€3,000,000' },
            { value: '10000000', label: '€10,000,000' },
            { value: '50000000', label: '€50,000,000+' },
          ],
          fields: filterOptionFields,
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        filterArrayField({
          name: 'features',
          label: 'Features',
          admin: {
            width: '100%',
            description: 'Values must be "sea views", "mountain", or "golf".',
          },
          defaultValue: [
            { value: 'sea views', label: 'Sea view' },
            { value: 'mountain', label: 'Mountain' },
            { value: 'golf', label: 'Golf' },
          ],
          fields: filterOptionFields,
        }),
      ],
    },
  ],
}
