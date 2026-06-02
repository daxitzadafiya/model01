'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'

import type { Header } from '@/payload-types'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { LanguageMenuItem, Locale } from '@/i18n/config'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: Locale
  languageMenu: LanguageMenuItem[]
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale, languageMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 transition-all duration-300 ${
        isScrolled ? 'h-16 shadow-md' : 'h-16 md:h-20 shadow-sm'
      }`}
    >
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center h-full gap-3">
        <Link
          className="font-headline-sm text-[13px] sm:text-headline-sm tracking-widest uppercase text-primary shrink-0"
          href="/"
        >
          <span className="md:hidden">ROUMPOS</span>
          <span className="hidden md:inline">ROUMPOS REAL ESTATE</span>
        </Link>

        <HeaderNav data={data} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher items={languageMenu} currentLocale={locale} />
          <Heart
            className="text-primary cursor-pointer hover:scale-110 transition-transform p-1"
            size={30}
          />
          <button
            type="button"
            className="hidden md:inline-flex px-6 py-2.5 rounded-full border border-tertiary text-tertiary font-label-nav text-label-nav hover:bg-tertiary hover:text-white transition-all duration-300 active:scale-95"
          >
            Book a Consultation
          </button>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="md:hidden w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-primary"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
