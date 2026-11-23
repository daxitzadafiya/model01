'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink, getCMSLinkHref, isCMSLinkActive } from '@/components/Link'
import { isLocale, type Locale } from '@/i18n/config'
import { getHeaderNavLinkClass } from '@/providers/HeroOverlay'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import { NavDropdown } from './NavDropdown'

type Props = {
  data: HeaderType
  mobileOpen?: boolean
  onClose?: () => void
  onDarkBackground?: boolean
}

type NavItem = NonNullable<HeaderType['navItems']>[number]

const linkIsActive = (pathname: string, link: NavItem['link'], locale: Locale) => {
  const href = getCMSLinkHref(link, locale)
  return href ? isCMSLinkActive(pathname, href) : false
}

const hasSubLinks = (item: NavItem) => (item.subLinks?.length ?? 0) > 0

export const HeaderNav: React.FC<Props> = ({
  data,
  mobileOpen,
  onClose,
  onDarkBackground = false,
}) => {
  const pathname = usePathname()
  const siteLocale = useSiteLocale()
  const locale: Locale = isLocale(siteLocale) ? siteLocale : 'en'
  const navItems = (data?.navItems || []).filter((item) => !item?.isDeleted)

  return (
    <>
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item, i) =>
          hasSubLinks(item) ? (
            <NavDropdown
              key={i}
              link={item.link}
              subLinks={item.subLinks!}
              onDarkBackground={onDarkBackground}
            />
          ) : (
            <CMSLink
              key={i}
              {...item.link}
              className={getHeaderNavLinkClass(linkIsActive(pathname, item.link, locale), onDarkBackground)}
            />
          ),
        )}
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className={`md:hidden fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm ${onDarkBackground ? 'top-[4.75rem]' : 'top-16'}`}
            onClick={onClose}
          />
          <div
            className={`md:hidden fixed left-0 right-0 z-50 overflow-y-auto bg-surface border-b border-outline-variant/30 shadow-lg ${onDarkBackground ? 'top-[4.75rem] max-h-[calc(100dvh-4.75rem)]' : 'top-16 max-h-[calc(100dvh-4rem)]'}`}
          >
            <nav className="flex flex-col px-margin-mobile py-6 gap-1">
              {navItems.map((item, i) =>
                hasSubLinks(item) ? (
                  <NavDropdown
                    key={i}
                    link={item.link}
                    subLinks={item.subLinks!}
                    variant="mobile"
                    onNavigate={onClose}
                  />
                ) : (
                  <div key={i} onClick={onClose} role="presentation">
                    <CMSLink
                      {...item.link}
                      className={`block py-3 ${getHeaderNavLinkClass(linkIsActive(pathname, item.link, locale), false)}`}
                    />
                  </div>
                ),
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
