import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  resolveOptimaCrmSettingsFromGlobal,
  type ResolvedOptimaCrmSettings,
} from '@/settings/optimaCrm/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getOptimaCrmSettings(): Promise<ResolvedOptimaCrmSettings> {
  try {
    const getGlobal = getCachedGlobal('optimaCrmSettings', 0)
    const doc = await getGlobal()
    return resolveOptimaCrmSettingsFromGlobal(doc)
  } catch {
    return EMPTY_OPTIMA_CRM_SETTINGS
  }
}

export type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'
