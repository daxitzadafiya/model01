'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { setLocale } from '@/i18n/actions'
import { getMenuItemForLocale, type LanguageMenuItem, type Locale } from '@/i18n/config'
import { cn } from '@/utilities/ui'

import { FlagIcon } from './FlagIcon'

type Props = {
  items: LanguageMenuItem[]
  currentLocale: Locale
}

export const LanguageSwitcher: React.FC<Props> = ({ items, currentLocale }) => {
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
      document.documentElement.lang = item.locale
      await setLocale(item.locale)
      router.refresh()
    })
  }

  if (items.length === 1) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-sm',
          'text-primary',
        )}
        aria-label={`Language: ${active.label}`}
      >
        <FlagIcon country={active.flagCountry} className="h-4 w-4 sm:h-5 sm:w-5" title={active.label} />
        <span className="hidden font-label-nav text-[11px] uppercase tracking-wider text-secondary sm:inline">
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
          'inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-sm',
          'text-primary transition-colors duration-200',
          'hover:border-outline-variant hover:bg-surface-container-low/60',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-outline-variant',
          open && 'border-outline-variant bg-surface-container-low/80',
          isPending && 'pointer-events-none opacity-60',
        )}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
      >
        <FlagIcon country={active.flagCountry} className="h-4 w-4 sm:h-5 sm:w-5" title={active.label} />
        <span className="hidden font-label-nav text-[11px] uppercase tracking-wider text-secondary sm:inline">
          {active.triggerCode}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-secondary transition-transform duration-200', open && 'rotate-180')}
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
                    'flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors duration-150',
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
