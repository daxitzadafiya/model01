'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink, getCMSLinkHref, isCMSLinkActive } from '@/components/Link'
import { NavDropdown } from './NavDropdown'

type Props = {
  data: HeaderType
  mobileOpen?: boolean
  onClose?: () => void
}

type NavItem = NonNullable<HeaderType['navItems']>[number]

const navLinkClass = (isActive: boolean) =>
  `font-label-nav text-label-nav font-medium transition-colors duration-300 ${
    isActive ? 'text-tertiary' : 'text-secondary hover:text-tertiary'
  }`

const linkIsActive = (pathname: string, link: NavItem['link']) => {
  const href = getCMSLinkHref(link)
  return href ? isCMSLinkActive(pathname, href) : false
}

const hasSubLinks = (item: NavItem) => (item.subLinks?.length ?? 0) > 0

export const HeaderNav: React.FC<Props> = ({ data, mobileOpen, onClose }) => {
  const pathname = usePathname()
  const navItems = data?.navItems || []

  return (
    <>
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item, i) =>
          hasSubLinks(item) ? (
            <NavDropdown key={i} link={item.link} subLinks={item.subLinks!} />
          ) : (
            <CMSLink key={i} {...item.link} className={navLinkClass(linkIsActive(pathname, item.link))} />
          ),
        )}
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="md:hidden fixed inset-0 top-16 z-40 bg-primary/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-surface border-b border-outline-variant/30 shadow-lg">
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
                      className={`block py-3 ${navLinkClass(linkIsActive(pathname, item.link))}`}
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
