'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'

import type { Header } from '@/payload-types'
import { getCMSLinkHref } from '@/components/Link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Logo from '@/components/Logo/Logo'
import type { LogoSources } from '@/components/Logo/getLogoSources'
import type { LanguageMenuItem, Locale } from '@/i18n/config'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import { useHeroOverlay } from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'
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
  const { isHeroOverlay } = useHeroOverlay()
  const { count: favoritesCount } = usePropertyFavorites()
  const favoritesLink = data.favoritesLink
  const favoritesHref = getCMSLinkHref(favoritesLink ?? {}) ?? '/favorites'
  const favoritesAriaLabel =
    favoritesLink?.label ||
    (favoritesCount > 0 ? `Favorites, ${favoritesCount} saved` : 'Favorites')

  const isTransparent = isHeroOverlay && !isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
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
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        isTransparent
          ? 'pt-3 md:pt-5 bg-transparent border-b border-transparent shadow-none backdrop-blur-none'
          : 'h-16 md:h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-md',
      )}
    >
      <div
        className={cn(
          'max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center gap-1.5 sm:gap-3',
          isTransparent ? 'pb-3 md:pb-4' : 'h-full',
        )}
      >
        <Link
          className="font-headline-sm text-[13px] sm:text-headline-sm tracking-widest uppercase min-w-0 flex-1 pr-1 sm:pr-0"
          href="/"
        >
          <Logo
            className="max-w-[10.5rem] min-[380px]:max-w-[11.5rem] sm:max-w-[14.5rem] md:max-w-[17.5rem]"
            sources={logoSources}
            onDarkBackground={isTransparent}
          />
        </Link>

        <HeaderNav
          data={data}
          mobileOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onDarkBackground={isTransparent}
        />

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Link
            href={favoritesHref}
            {...(favoritesLink?.newTab
              ? { rel: 'noopener noreferrer', target: '_blank' }
              : {})}
            aria-label={
              favoritesCount > 0 && !favoritesLink?.label
                ? `${favoritesAriaLabel}, ${favoritesCount} saved`
                : favoritesAriaLabel
            }
            className={cn(
              'relative hover:scale-110 transition-transform p-1',
              isTransparent ? 'text-white' : 'text-primary',
            )}
          >
            <Heart size={30} />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tertiary text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {favoritesCount > 99 ? '99+' : favoritesCount || '0'}
            </span>
          </Link>
          <LanguageSwitcher
            items={languageMenu}
            currentLocale={locale}
            onDarkBackground={isTransparent}
          />
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={cn(
              'md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center',
              isTransparent
                ? 'border-white/40 text-white'
                : 'border-outline-variant text-primary',
            )}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
