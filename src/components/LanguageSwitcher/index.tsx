'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { setLocale } from '@/i18n/actions'
import { dispatchSiteLocaleChange } from '@/i18n/localeEvents'
import { getMenuItemForLocale, type LanguageMenuItem, type Locale } from '@/i18n/config'
import { cn } from '@/utilities/ui'
import { invalidateTranslationsForLocale } from '@/utilities/translationStore'

import { FlagIcon } from './FlagIcon'

type Props = {
  items: LanguageMenuItem[]
  currentLocale: Locale
  onDarkBackground?: boolean
}

export const LanguageSwitcher: React.FC<Props> = ({
  items,
  currentLocale,
  onDarkBackground = false,
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = getMenuItemForLocale(items, currentLocale)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  if (items.length === 0) {
    return null
  }

  const selectItem = (item: LanguageMenuItem) => {
    if (item.locale === currentLocale || isPending) {
      setOpen(false)
      return
    }

    setOpen(false)
    startTransition(async () => {
      dispatchSiteLocaleChange(item.locale)
      invalidateTranslationsForLocale(item.locale)
      await setLocale(item.locale)
      router.refresh()
    })
  }

  if (items.length === 1) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full border cursor-pointer px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-sm',
          onDarkBackground
            ? 'border-white/40 text-white'
            : 'border-outline-variant/50 text-primary',
        )}
        aria-label={`Language: ${active.label}`}
      >
        <FlagIcon country={active.flagCountry} className="h-4 w-4 sm:h-5 sm:w-5" title={active.label} />
        <span
          className={cn(
            'hidden font-label-nav text-[11px] uppercase tracking-wider sm:inline',
            onDarkBackground ? 'text-white/90' : 'text-secondary',
          )}
        >
          {active.triggerCode}
        </span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${active.label}`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border cursor-pointer px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-sm transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-1',
          onDarkBackground
            ? 'border-white/40 text-white hover:border-white/70 hover:bg-white/10 focus-visible:ring-white/40'
            : 'border-outline-variant/50 text-primary hover:border-outline-variant hover:bg-surface-container-low/60 focus-visible:ring-outline-variant',
          open &&
            (onDarkBackground ? 'border-white/70 bg-white/10' : 'border-outline-variant bg-surface-container-low/80'),
          isPending && 'pointer-events-none opacity-60',
        )}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
      >
        <FlagIcon country={active.flagCountry} className="h-4 w-4 sm:h-5 sm:w-5" title={active.label} />
        <span
          className={cn(
            'hidden font-label-nav text-[11px] uppercase tracking-wider sm:inline',
            onDarkBackground ? 'text-white/90' : 'text-secondary',
          )}
        >
          {active.triggerCode}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-200',
            onDarkBackground ? 'text-white/80' : 'text-secondary',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className={cn(
            'absolute right-0 z-60 mt-1.5 min-w-36 overflow-hidden rounded-lg border border-outline-variant/40',
            'bg-surface/98 py-1 shadow-md backdrop-blur-sm',
            'animate-[lang-menu-in_0.18s_ease-out]',
          )}
        >
          {items.map((item) => {
            const isActive = item.locale === currentLocale

            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors duration-150 cursor-pointer',
                    isActive
                      ? 'bg-surface-container-low text-primary'
                      : 'text-secondary hover:bg-surface-container-low/80 hover:text-primary',
                  )}
                  onClick={() => selectItem(item)}
                >
                  <FlagIcon country={item.flagCountry} className="h-5 w-5" title={item.label} />
                  <span className="flex-1 font-label-nav text-[11px] uppercase tracking-wide">
                    {item.label}
                  </span>
                  {isActive && (
                    <Check size={16} className="text-tertiary" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
