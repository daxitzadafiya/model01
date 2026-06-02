import { getCachedGlobal } from '@/utilities/getGlobals'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import Link from 'next/link'
import React from 'react'
import {
  Award,
  BadgeCheck,
  Globe,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Share2,
} from 'lucide-react'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { getLogoSources } from '@/components/Logo/getLogoSources'

function formatCopyright(text: string): string {
  return text.replace(/\{year\}/g, String(new Date().getFullYear()))
}

export async function Footer() {
  const { locale } = await getActiveLocale()
  const [footerData, logoData] = await Promise.all([
    getCachedGlobal('footer', 1, locale)(),
    getCachedGlobal('logo', 1)(),
  ])
  const logoSources = getLogoSources(logoData)

  const tagline = footerData?.tagline
  const socialLinks = footerData?.socialLinks ?? []
  const quickLinksTitle = footerData?.quickLinksTitle ?? 'QUICK LINKS'
  const navItems = footerData?.navItems ?? []
  const contactTitle = footerData?.contactTitle ?? 'CONTACT US'
  const contact = footerData?.contact
  const certificationsTitle = footerData?.certificationsTitle ?? 'CERTIFICATIONS'
  const certifications = footerData?.certifications ?? []
  const copyrightText =
    footerData?.copyrightText ?? '© {year} HORIZON ESTATES. ALL RIGHTS RESERVED.'
  const legalLinks = footerData?.legalLinks ?? []

  return (
    <footer className="bg-primary py-12 md:py-16 text-on-primary-fixed reveal active">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-gutter">
        <div className="sm:col-span-2 md:col-span-1">
          <Link className="inline-block mb-4 md:mb-8" href="/">
            <Logo
              className="max-w-[14rem] sm:max-w-[16rem] md:max-w-[19rem]"
              onDarkBackground
              sources={logoSources}
            />
          </Link>
          {tagline && (
            <p className="font-body-md text-body-md text-on-primary-fixed-variant mb-6 md:mb-8 max-w-md">
              {tagline}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map(({ icon, url, newTab, id }, i) => (
                <a
                  key={id || i}
                  className="material-symbols-outlined cursor-pointer text-tertiary transition-colors hover:text-surface-bright"
                  href={url}
                  rel={newTab ? 'noopener noreferrer' : undefined}
                  target={newTab ? '_blank' : undefined}
                >
                  {icon}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
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
                    className="hover:text-surface-bright transition-colors text-white"
                    {...link}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          {contactTitle && (
            <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
              {contactTitle}
            </h4>
          )}
          {(contact?.phone || contact?.email || contact?.address) && (
            <ul className="space-y-3 md:space-y-4 font-body-md text-body-md">
              {contact?.phone && (
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-tertiary shrink-0">call</span>
                  <a
                    className="hover:text-surface-bright transition-colors"
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-tertiary shrink-0">mail</span>
                  <a
                    className="hover:text-surface-bright transition-colors"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-start gap-3 text-white">
                  <span className="material-symbols-outlined text-tertiary shrink-0">
                    location_on
                  </span>
                  {contact.address}
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="sm:col-span-2 md:col-span-1">
          {certificationsTitle && (
            <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
              {certificationsTitle}
            </h4>
          )}
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {certifications.map(({ icon, id }, i) => (
                <div
                  key={id || i}
                  className="bg-white/10 w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center opacity-50 grayscale text-white"
                >
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mt-12 md:mt-20 pt-6 md:pt-8 border-t border-on-primary-fixed-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        {copyrightText && (
          <p className="font-label-sm text-label-sm text-on-primary-fixed-variant">
            {formatCopyright(copyrightText)}
          </p>
        )}
        {legalLinks.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 md:gap-6 font-label-sm text-label-sm text-white">
            {legalLinks.map(({ link }, i) => (
              <CMSLink key={i} className="hover:text-tertiary" {...link} />
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}
