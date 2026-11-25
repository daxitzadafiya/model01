import { type ResolvedEmailSettings, isEmailConfigured } from '@/settings/email/shared'
import { getLiveGlobal } from '@/utilities/getGlobals'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

/** Always read Email settings live from the database (never Next.js cache). */
export async function getEmailSettings(): Promise<ResolvedEmailSettings | null> {
  try {
    const doc = await getLiveGlobal('emailSettings', 0)
    if (isGlobalTrashed(doc)) return null
    return doc ?? null
  } catch {
    return null
  }
}

export type { ResolvedEmailSettings } from '@/settings/email/shared'
export { isEmailConfigured } from '@/settings/email/shared'
