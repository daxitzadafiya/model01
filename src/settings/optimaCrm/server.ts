import { seedOptimaCrmSettings } from '@/settings/optimaCrm/client'
import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  readOptimaCrmEnvConfig,
  resolveOptimaCrmSettingsFromGlobal,
  similarCommercialsQueryClause,
  type ResolvedOptimaCrmSettings,
  type SimilarCommercialsMode,
} from '@/settings/optimaCrm/shared'
import { getLiveGlobal } from '@/utilities/getGlobals'

/** Always read Optima CRM settings live from the database (never Next.js cache). */
export async function getOptimaCrmSettings(): Promise<ResolvedOptimaCrmSettings> {
  try {
    const doc = await getLiveGlobal('optimaCrmSettings', 0)
    const resolved = resolveOptimaCrmSettingsFromGlobal(doc)
    // Seed sync runtime config so normalize helpers see admin REF field choices on the server.
    seedOptimaCrmSettings(resolved)
    return resolved
  } catch {
    return {
      ...EMPTY_OPTIMA_CRM_SETTINGS,
      ...readOptimaCrmEnvConfig(),
    }
  }
}

export async function getSimilarCommercialsQuery(): Promise<{
  similar_commercials: SimilarCommercialsMode
}> {
  const settings = await getOptimaCrmSettings()
  return similarCommercialsQueryClause(settings)
}

export type {
  PropertyReferenceField,
  ProjectReferenceField,
  ResolvedOptimaCrmSettings,
  SimilarCommercialsMode,
} from '@/settings/optimaCrm/shared'
