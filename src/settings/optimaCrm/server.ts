import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  resolveOptimaCrmSettingsFromGlobal,
  similarCommercialsQueryClause,
  type ResolvedOptimaCrmSettings,
  type SimilarCommercialsMode,
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

export async function getSimilarCommercialsQuery(): Promise<{
  similar_commercials: SimilarCommercialsMode
}> {
  const settings = await getOptimaCrmSettings()
  return similarCommercialsQueryClause(settings)
}

export type { ResolvedOptimaCrmSettings, SimilarCommercialsMode } from '@/settings/optimaCrm/shared'
