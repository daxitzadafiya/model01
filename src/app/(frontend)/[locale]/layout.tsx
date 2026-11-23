import { notFound } from 'next/navigation'
import React from 'react'

import { isLocale, localeCodes } from '@/i18n/config'

type Args = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Args) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }

  return children
}
