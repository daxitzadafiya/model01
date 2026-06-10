import type { GlobalAfterChangeHook } from 'payload'

import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateLocalization: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating localization')
    await revalidateCacheTag('global_localization')
  }

  return doc
}
