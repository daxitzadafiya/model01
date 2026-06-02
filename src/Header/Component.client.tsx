'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'

import type { Header } from '@/payload-types'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Logo from '@/components/Logo/Logo'
import type { LogoSources } from '@/components/Logo/getLogoSources'
import type { LanguageMenuItem, Locale } from '@/i18n/config'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: Locale
  languageMenu: LanguageMenuItem[]
  logoSources: LogoSources
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  locale,
  languageMenu,
  logoSources,
}) => {
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
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center h-full gap-1.5 sm:gap-3">
        <Link
          className="font-headline-sm text-[13px] sm:text-headline-sm tracking-widest uppercase text-primary min-w-0 flex-1 pr-1 sm:pr-0"
          href="/"
        >
          <Logo
            className="max-w-[10.5rem] min-[380px]:max-w-[11.5rem] sm:max-w-[14.5rem] md:max-w-[17.5rem]"
            sources={logoSources}
          />
        </Link>

        <HeaderNav data={data} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
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
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-outline-variant flex items-center justify-center text-primary"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
