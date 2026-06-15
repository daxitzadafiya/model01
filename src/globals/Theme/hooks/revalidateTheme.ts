import type { GlobalAfterChangeHook } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateTheme: GlobalAfterChangeHook = async ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating theme`)

    await revalidateCacheTag('global_theme')
    await revalidateCachePath('/')
  }

  return doc
}
