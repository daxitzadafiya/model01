import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { localeCodes } from '@/i18n/locales'

export const revalidatePropertyMap: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating property map settings')

    revalidateTag('global_propertyMap', 'max')
    for (const locale of localeCodes) {
      revalidateTag(`global_propertyMap_${locale}`, 'max')
    }
  }

  return doc
}
