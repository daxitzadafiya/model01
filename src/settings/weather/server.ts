import {
  EMPTY_WEATHER_SETTINGS,
  resolveWeatherSettingsFromGlobal,
  type ResolvedWeatherSettings,
} from '@/settings/weather/shared'
import { getLiveGlobal } from '@/utilities/getGlobals'

/** Always read Weather settings live from the database (never Next.js cache). */
export async function getWeatherSettings(): Promise<ResolvedWeatherSettings> {
  try {
    const doc = await getLiveGlobal('weatherSettings', 0)
    return resolveWeatherSettingsFromGlobal(doc)
  } catch {
    return EMPTY_WEATHER_SETTINGS
  }
}

export type { ResolvedWeatherSettings } from '@/settings/weather/shared'
