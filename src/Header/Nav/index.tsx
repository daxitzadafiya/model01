'use client'

import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'

type Props = {
  data: HeaderType
  mobileOpen?: boolean
  onClose?: () => void
}

const navLinkClass = (isActive: boolean) =>
  `font-label-nav text-label-nav font-medium transition-colors duration-300 ${
    isActive
      ? 'text-primary font-bold border-b-2 border-tertiary pb-1'
      : 'text-secondary hover:text-tertiary'
  }`

export const HeaderNav: React.FC<Props> = ({ data, mobileOpen, onClose }) => {
  const navItems = data?.navItems || []

  return (
    <>
      <div className="hidden md:flex items-center gap-8">
        {navItems.map(({ link }, i) => (
          <CMSLink key={i} {...link} className={navLinkClass(i === 0)} />
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
                  <CMSLink {...link} className={`block py-3 ${navLinkClass(i === 0)}`} />
                </div>
              ))}
              <button
                type="button"
                className="mt-4 w-full px-6 py-3 rounded-full border border-tertiary text-tertiary font-label-nav text-label-nav hover:bg-tertiary hover:text-white transition-all"
                onClick={onClose}
              >
                Book a Consultation
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
