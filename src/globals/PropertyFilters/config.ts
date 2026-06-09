import type { ArrayField, Field, GlobalConfig } from 'payload'

import { revalidatePropertyFilters } from './hooks/revalidatePropertyFilters'

const COL_THIRD = '33.33%' as const
const COL_HALF = '50%' as const

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
      'Dropdown options for property search filters. Property type and location still come from the CRM API.',
  },
  hooks: {
    afterChange: [revalidatePropertyFilters],
  },
  fields: [
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
          admin: { width: COL_THIRD },
          defaultValue: [
            { value: 'any', label: 'Any Bedrooms' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' },
          ],
          fields: filterOptionFields,
        }),
        filterArrayField({
          name: 'minPrices',
          label: 'Min price',
          admin: { width: COL_THIRD },
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
          admin: { width: COL_THIRD },
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
          name: 'statuses',
          label: 'Status',
          admin: {
            width: COL_HALF,
            description: 'Values must be "project" (new development) or "resale".',
          },
          defaultValue: [
            { value: 'project', label: 'New development' },
            { value: 'resale', label: 'Resale' },
          ],
          fields: filterOptionFields,
        }),
        filterArrayField({
          name: 'features',
          label: 'Features',
          admin: {
            width: COL_HALF,
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
    {
      type: 'row',
      fields: [
        filterArrayField({
          name: 'deliveryDates',
          label: 'Delivery date',
          admin: {
            width: COL_HALF,
            description:
              'Empty value = placeholder. Other values are months (1 = handover, 3, 6, 12, 18, 60).',
          },
          defaultValue: [
            { value: '', label: 'Delivery date' },
            { value: '1', label: 'Handover' },
            { value: '3', label: '3 months' },
            { value: '6', label: '6 months' },
            { value: '12', label: '12 months' },
            { value: '18', label: '18 months' },
            { value: '60', label: '18 months or older' },
          ],
          fields: filterOptionFields,
        }),
        filterArrayField({
          name: 'distanceToSea',
          label: 'Distance to the sea',
          admin: {
            width: COL_HALF,
            description:
              'Empty value = placeholder. Distances in meters. Use 1000000 for "indifferent".',
          },
          defaultValue: [
            { value: '', label: 'Distance to the sea' },
            { value: '600', label: 'Less than 600 m' },
            { value: '1000', label: 'Less than 1 km' },
            { value: '3000', label: 'Less than 3 km' },
            { value: '6000', label: 'Less than 6 km' },
            { value: '12000', label: 'Less than 12 km' },
            { value: '1000000', label: 'Indifferent' },
          ],
          fields: filterOptionFields,
        }),
      ],
    },
  ],
}
