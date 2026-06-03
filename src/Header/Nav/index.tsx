'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink, getCMSLinkHref, isCMSLinkActive } from '@/components/Link'

type Props = {
  data: HeaderType
  mobileOpen?: boolean
  onClose?: () => void
}

const navLinkClass = (isActive: boolean) =>
  `font-label-nav text-label-nav font-medium transition-colors duration-300 ${
    isActive ? 'text-tertiary' : 'text-secondary hover:text-tertiary'
  }`

export const HeaderNav: React.FC<Props> = ({ data, mobileOpen, onClose }) => {
  const pathname = usePathname()
  const navItems = data?.navItems || []

  const linkIsActive = (link: (typeof navItems)[number]['link']) => {
    const href = getCMSLinkHref(link)
    return href ? isCMSLinkActive(pathname, href) : false
  }

  return (
    <>
      <div className="hidden md:flex items-center gap-8">
        {navItems.map(({ link }, i) => (
          <CMSLink key={i} {...link} className={navLinkClass(linkIsActive(link))} />
        ))}
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
              {navItems.map(({ link }, i) => (
                <div key={i} onClick={onClose} role="presentation">
                  <CMSLink {...link} className={`block py-3 ${navLinkClass(linkIsActive(link))}`} />
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
