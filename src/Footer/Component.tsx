import { getCachedGlobal } from '@/utilities/getGlobals'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import Link from 'next/link'
import React from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'
import { SocialIcon } from '@/components/SocialIcon'
import { getLogoSources } from '@/components/Logo/getLogoSources'
import { DEFAULT_APP_NAME, getAppName } from '@/utilities/getAppName'
import {
  DEFAULT_POWERED_BY_LINK_LABEL,
  DEFAULT_POWERED_BY_TEXT,
  DEFAULT_POWERED_BY_URL,
  DEFAULT_RIGHTS_RESERVED,
} from '@/Footer/formatCopyright'
import type { FooterColumnWidth } from '@/Footer/sectionLayoutFields'
import type { Footer as FooterType, Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'

const COLUMN_WIDTH_CLASS: Record<FooterColumnWidth, string> = {
  '2': 'md:col-span-2',
  '3': 'md:col-span-3',
  '4': 'md:col-span-4',
}

const DEFAULT_SECTION_ORDER = {
  brand: 1,
  quickLinks: 2,
  contact: 3,
  certifications: 4,
} as const

type ColumnSectionKey = keyof typeof DEFAULT_SECTION_ORDER

function resolveColumnWidth(value: string | null | undefined): FooterColumnWidth {
  if (value === '2' || value === '3' || value === '4') return value
  return '3'
}

function isShown(value: boolean | null | undefined): boolean {
  return value !== false
}

function resolveOrder(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export async function Footer() {
  const { locale } = await getActiveLocale()
  const [footerData, logoData] = await Promise.all([
    getCachedGlobal('footer', 1, locale)(),
    getCachedGlobal('logo', 1)(),
  ])

  const logoSources = getLogoSources(logoData)
  const appName = getAppName(logoData)

  const tagline = footerData?.tagline
  const socialLinks = footerData?.socialLinks ?? []
  const quickLinksTitle = footerData?.quickLinksTitle ?? 'QUICK LINKS'
  const navItems = footerData?.navItems ?? []
  const contactTitle = footerData?.contactTitle ?? 'CONTACT US'
  const contact = footerData?.contact
  const certificationsTitle = footerData?.certificationsTitle ?? 'CERTIFICATIONS'
  const certifications = footerData?.certifications ?? []
  const certificationsHref = getCMSLinkHref(footerData?.certificationsLink ?? {})
  const certificationsNewTab = Boolean(footerData?.certificationsLink?.newTab)
  const rightsReserved = footerData?.copyrightText ?? DEFAULT_RIGHTS_RESERVED
  const poweredByText = footerData?.poweredBy?.text ?? DEFAULT_POWERED_BY_TEXT
  const poweredByLinkLabel =
    footerData?.poweredBy?.linkLabel ?? DEFAULT_POWERED_BY_LINK_LABEL
  const poweredByUrl = footerData?.poweredBy?.url?.trim() || DEFAULT_POWERED_BY_URL
  const showPoweredBy = Boolean(poweredByText.trim() && poweredByLinkLabel.trim())
  const legalLinks = footerData?.legalLinks ?? []

  const data = footerData as FooterType | null

  const columnSections: Array<{
    key: ColumnSectionKey
    order: number
    widthClass: string
    content: React.ReactNode
  }> = []

  if (isShown(data?.brandShowOnSite)) {
    columnSections.push({
      key: 'brand',
      order: resolveOrder(data?.brandDisplayOrder, DEFAULT_SECTION_ORDER.brand),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.brandColumnWidth)],
      content: (
        <>
          <Link className="inline-block mb-4 md:mb-8" href="/">
            <Logo placement="footer" onDarkBackground sources={logoSources} />
          </Link>
          {tagline && (
            <p className="font-body-md text-body-md text-on-primary mb-6 md:mb-8 max-w-md">
              {tagline}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map(({ icon, url, newTab, id }, i) => (
                <a
                  key={id || i}
                  className="cursor-pointer text-tertiary transition-colors hover:text-surface-bright"
                  href={url}
                  rel={newTab ? 'noopener noreferrer' : undefined}
                  target={newTab ? '_blank' : undefined}
                >
                  <SocialIcon className="text-tertiary" name={icon} size={22} />
                </a>
              ))}
            </div>
          )}
        </>
      ),
    })
  }

  if (isShown(data?.quickLinksShowOnSite)) {
    columnSections.push({
      key: 'quickLinks',
      order: resolveOrder(data?.quickLinksDisplayOrder, DEFAULT_SECTION_ORDER.quickLinks),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.quickLinksColumnWidth)],
      content: (
        <>
          {quickLinksTitle && (
            <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
              {quickLinksTitle}
            </h4>
          )}
          {navItems.length > 0 && (
            <ul className="space-y-3 md:space-y-4 font-body-md text-body-md">
              {navItems.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink
                    className="hover:text-tertiary transition-colors text-on-primary"
                    {...link}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ),
    })
  }

  if (isShown(data?.contactShowOnSite)) {
    columnSections.push({
      key: 'contact',
      order: resolveOrder(data?.contactDisplayOrder, DEFAULT_SECTION_ORDER.contact),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.contactColumnWidth)],
      content: (
        <>
          {contactTitle && (
            <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
              {contactTitle}
            </h4>
          )}
          {(contact?.phone || contact?.email || contact?.address) && (
            <ul className="space-y-3 md:space-y-4 font-body-md text-body-md">
              {contact?.phone && (
                <li className="flex items-center gap-3 text-on-primary">
                  <Phone className="text-tertiary shrink-0" size={18} strokeWidth={2} />
                  <a
                    className="hover:text-surface-bright transition-colors"
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-3 text-on-primary">
                  <Mail className="text-tertiary shrink-0" size={18} strokeWidth={2} />
                  <a
                    className="hover:text-surface-bright transition-colors"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-start gap-3 text-on-primary">
                  <MapPin className="text-tertiary shrink-0" size={18} strokeWidth={2} />
                  {contact.address}
                </li>
              )}
            </ul>
          )}
        </>
      ),
    })
  }

  if (isShown(data?.certificationsShowOnSite)) {
    columnSections.push({
      key: 'certifications',
      order: resolveOrder(data?.certificationsDisplayOrder, DEFAULT_SECTION_ORDER.certifications),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.certificationsColumnWidth)],
      content: (
        <>
          {certificationsTitle && (
            <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
              {certificationsTitle}
            </h4>
          )}
          {certifications.length > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {certifications.map(({ image, label, id }, i) => {
                const media = typeof image === 'object' && image !== null ? (image as MediaType) : null
                if (!media) return null

                const alt = label || media.alt || 'Certification'
                const badge = (
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm bg-white shadow-sm transition-opacity hover:opacity-90">
                    <Media
                      resource={media}
                      alt={alt}
                      fill
                      imgClassName=""
                      className="absolute inset-0"
                    />
                  </div>
                )

                if (!certificationsHref) {
                  return <div key={id || i}>{badge}</div>
                }

                return (
                  <Link
                    key={id || i}
                    href={certificationsHref}
                    target={certificationsNewTab ? '_blank' : undefined}
                    rel={certificationsNewTab ? 'noopener noreferrer' : undefined}
                    aria-label={alt}
                    className="block"
                  >
                    {badge}
                  </Link>
                )
              })}
            </div>
          )}
        </>
      ),
    })
  }

  columnSections.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return DEFAULT_SECTION_ORDER[a.key] - DEFAULT_SECTION_ORDER[b.key]
  })

  const showBottomBar = isShown(data?.bottomBarShowOnSite)
  const hasColumns = columnSections.length > 0

  if (!hasColumns && !showBottomBar) {
    return null
  }

  return (
    <footer className="bg-primary py-12 md:py-16 text-on-primary reveal active">
      {hasColumns && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-10 md:gap-gutter">
          {columnSections.map(({ key, widthClass, content }) => (
            <div key={key} className={cn('sm:col-span-1', widthClass)}>
              {content}
            </div>
          ))}
        </div>
      )}
      {showBottomBar && (
        <div
          className={cn(
            'max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left',
            hasColumns
              ? 'mt-12 md:mt-20 pt-6 md:pt-8 border-t border-on-primary/20'
              : '',
          )}
        >
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            {rightsReserved && (
              <p className="font-label-sm text-label-sm text-on-primary uppercase">
                © {new Date().getFullYear()}{' '}
                <span className="text-tertiary">{appName || DEFAULT_APP_NAME}</span>.{' '}
                {rightsReserved || DEFAULT_RIGHTS_RESERVED}
              </p>
            )}
            {showPoweredBy && (
              <p className="font-label-sm text-label-sm text-on-primary">
                {poweredByText.trim()}{' '}
                <a
                  className="text-tertiary hover:text-surface-bright transition-colors"
                  href={poweredByUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {poweredByLinkLabel.trim()}
                </a>
              </p>
            )}
          </div>
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 md:gap-6 font-label-sm text-label-sm text-on-primary">
              {legalLinks.map(({ link }, i) => (
                <CMSLink key={i} className="hover:text-tertiary" {...link} />
              ))}
            </div>
          )}
        </div>
      )}
    </footer>
  )
}
