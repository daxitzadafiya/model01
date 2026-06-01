import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { localeCodes } from '@/i18n/locales'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    revalidateTag('global_header', 'max')
    for (const locale of localeCodes) {
      revalidateTag(`global_header_${locale}`, 'max')
    }
  }

  return doc
}
