import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { localeCodes } from '@/i18n/locales'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    revalidateTag('global_footer', 'max')
    for (const locale of localeCodes) {
      revalidateTag(`global_footer_${locale}`, 'max')
    }
  }

  return doc
}
