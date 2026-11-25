import {
  EMPTY_INTEGRATIONS_SETTINGS,
  resolveIntegrationsSettingsFromGlobal,
  toPublicIntegrationsSettings,
  type PublicIntegrationsSettings,
  type ResolvedIntegrationsSettings,
} from '@/settings/integrations/shared'
import { getLiveGlobal } from '@/utilities/getGlobals'

/** Always read Integrations settings live from the database (never Next.js cache). */
export async function getIntegrationsSettings(): Promise<ResolvedIntegrationsSettings> {
  try {
    const doc = await getLiveGlobal('integrationsSettings', 0)
    return resolveIntegrationsSettingsFromGlobal(doc)
  } catch {
    return EMPTY_INTEGRATIONS_SETTINGS
  }
}

export async function getPublicIntegrationsSettings(): Promise<PublicIntegrationsSettings> {
  const settings = await getIntegrationsSettings()
  return toPublicIntegrationsSettings(settings)
}

export type { ResolvedIntegrationsSettings } from '@/settings/integrations/shared'
