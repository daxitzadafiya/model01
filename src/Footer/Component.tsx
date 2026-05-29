import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { CMSLink } from '@/components/Link'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()
  const navItems = footerData?.navItems || []

  return (
    <footer className="bg-primary py-12 md:py-16 text-on-primary-fixed reveal active">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-gutter">
        <div className="sm:col-span-2 md:col-span-1">
          <h2 className="font-headline-md text-headline-md md:text-headline-md text-surface-bright mb-4 md:mb-8">
          ROUMPOS REAL ESTATE
          </h2>
          <p className="font-body-md text-body-md text-on-primary-fixed-variant mb-6 md:mb-8 max-w-md">
            Elevating the Greek real estate experience through heritage,
            transparency, and architectural excellence.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined cursor-pointer hover:text-tertiary transition-colors">
              public
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-tertiary transition-colors">
              share
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-tertiary transition-colors">
              language
            </span>
          </div>
        </div>
        <div>
          <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
            QUICK LINKS
          </h4>
          <ul className="space-y-3 md:space-y-4 font-body-md text-body-md">
            {navItems.map(({ link }, i) => (
              <li key={i}>
                <CMSLink className="hover:text-surface-bright transition-colors text-white" {...link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
            CONTACT US
          </h4>
          <ul className="space-y-3 md:space-y-4 font-body-md text-body-md">
            <li className="flex items-center gap-3 text-white">
              <span className="material-symbols-outlined text-tertiary shrink-0">call</span>
              +30 210 3388 000
            </li>
            <li className="flex items-center gap-3 text-white">
              <span className="material-symbols-outlined text-tertiary shrink-0">mail</span>
              info@roumpos.com
            </li>
            <li className="flex items-start gap-3 text-white">
              <span className="material-symbols-outlined text-tertiary shrink-0">location_on</span>
              Skoufa 12, Athens
            </li>
          </ul>
        </div>
        <div className="sm:col-span-2 md:col-span-1">
          <h4 className="font-label-nav text-label-nav text-tertiary uppercase mb-4 md:mb-8">
            CERTIFICATIONS
          </h4>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center opacity-50 grayscale text-white">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div className="bg-white/10 w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center opacity-50 grayscale text-white">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <div className="bg-white/10 w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center opacity-50 grayscale text-white">
              <span className="material-symbols-outlined">security</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mt-12 md:mt-20 pt-6 md:pt-8 border-t border-on-primary-fixed-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p className="font-label-sm text-label-sm text-on-primary-fixed-variant">

          © {new Date().getFullYear()} ROUMPOS REAL ESTATE. ALL RIGHTS RESERVED.
        </p>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 md:gap-6 font-label-sm text-label-sm text-white">
          <Link className="hover:text-tertiary" href="#">
            Privacy Policy
          </Link>
          <Link className="hover:text-tertiary" href="#">
            Terms of Service
          </Link>
          <Link className="hover:text-tertiary" href="#">
            Cookie Policy
          </Link>
          <Link className="hover:text-tertiary" href="#">
            Certifications
          </Link>
        </div>
      </div>
    </footer>
  )
}
