import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { localeCodes } from '@/i18n/locales'

export const revalidateCookieConsent: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating cookie consent`)

    revalidateTag('global_cookieConsent', 'max')
    for (const locale of localeCodes) {
      revalidateTag(`global_cookieConsent_${locale}`, 'max')
    }
  }

  return doc
}
