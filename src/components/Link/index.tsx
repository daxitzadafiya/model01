'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'
import { isLocale, type Locale } from '@/i18n/config'
import { useSiteLocale } from '@/utilities/useSiteLocale'

import { getCMSLinkHref, isCMSLinkActive } from './getCMSLinkHref'

export { getCMSLinkHref, isCMSLinkActive }

export type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  locale?: Locale
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number | null
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    locale: localeProp,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const siteLocale = useSiteLocale()
  const resolvedSiteLocale: Locale = isLocale(siteLocale) ? siteLocale : 'en'
  const locale = localeProp ?? resolvedSiteLocale
  const href = getCMSLinkHref({ type, reference, url }, locale)

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
