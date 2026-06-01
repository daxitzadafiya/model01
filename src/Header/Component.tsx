import { HeaderClient } from './Component.client'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

export async function Header() {
  const { locale, languageMenu } = await getActiveLocale()
  const headerData = await getCachedGlobal('header', 1, locale)()

  return <HeaderClient data={headerData} locale={locale} languageMenu={languageMenu} />
}
