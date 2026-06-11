import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { invalidateWeatherCache } from '@/utilities/weather/cache'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const WeatherSettings: GlobalConfig = {
  slug: 'weatherSettings',
  label: 'Weather',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description:
      'WeatherAPI.com credentials and cache settings for the hero search bar. API responses are cached server-side to reduce external API calls.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show weather in hero search bar',
      defaultValue: true,
    },
    {
      name: 'baseUrl',
      type: 'text',
      label: 'API base URL',
      defaultValue: 'https://api.weatherapi.com/v1/current.json',
      admin: {
        readOnly: true,
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: 'Fixed WeatherAPI.com endpoint — not editable.',
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: 'API key',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description:
          'Your WeatherAPI.com key. Stored in the database — not in environment variables.',
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Location query',
      defaultValue: 'Javea',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: 'City name or coordinates passed as the q parameter (e.g. Javea, Athens).',
      },
    },
    {
      name: 'cacheIntervalMinutes',
      type: 'number',
      label: 'Cache refresh interval (minutes)',
      defaultValue: 5,
      min: 1,
      max: 120,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description:
          'How long to reuse a cached API response before fetching fresh data from WeatherAPI.com.',
      },
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateWeatherCache()
        await revalidateCacheTag('global_weatherSettings')
      },
    ],
  },
}
