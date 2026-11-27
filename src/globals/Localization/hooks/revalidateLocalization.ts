import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { syncAdminLanguagesFromLocalization } from '@/i18n/syncAdminLanguagesFromLocalization'
import { ensureAdminI18nSynced } from '@/utilities/adminI18n'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateLocalization: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating localization')
    await revalidateCacheTag('global_localization')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_localization_${locale}`)
    }
    // Sitemap locale lists come from Localization → Site languages.
    await revalidateCacheTag('pages-sitemap')
    await revalidateCacheTag('posts-sitemap')
  }

  try {
    const locales = await syncAdminLanguagesFromLocalization(payload)
    await ensureAdminI18nSynced(payload, { locales })
  } catch (error) {
    payload.logger.error({ err: error }, '[adminLanguages] Sync after Localization save failed')
  }

  return doc
}
