import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { localeCodes } from '@/i18n/locales'

export const revalidatePropertyFilters: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating property filter options')

    revalidateTag('global_propertyFilters', 'max')
    for (const locale of localeCodes) {
      revalidateTag(`global_propertyFilters_${locale}`, 'max')
    }
  }

  return doc
}
