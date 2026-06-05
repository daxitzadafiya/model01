'use client'

import { Mail, MessageCircle, Share2 } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type ShareChannel = 'facebook' | 'whatsapp' | 'email'

type ShareLink = {
  id: ShareChannel
  label: string
  href: string
}

function getPageUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

function buildShareLinks(pageUrl: string): ShareLink[] {
  const encodedUrl = encodeURIComponent(pageUrl)

  return [
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`\n${pageUrl}`)}`,
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?body=${encodedUrl}`,
    },
  ]
}

export const PropertyDetailShareMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const pageUrl = open ? getPageUrl() : ''
  const shareLinks = pageUrl ? buildShareLinks(pageUrl) : []

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu()
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [closeMenu, open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Share property"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:border-tertiary hover:text-tertiary transition-all cursor-pointer"
      >
        <Share2 size={22} strokeWidth={1.75} />
      </button>

      {open && shareLinks.length > 0 && (
        <div
          role="menu"
          aria-label="Share property"
          className="absolute bottom-full right-0 z-30 mb-3 w-56 overflow-hidden rounded-lg bg-primary text-on-primary shadow-2xl border border-outline-variant/20"
        >
          <p className="px-4 pt-4 pb-3 font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-primary/90">
            Share to your
          </p>
          <div className="mx-4 border-t border-on-primary/25" />
          <ul className="py-2">
            {shareLinks.map((channel) => (
              <li key={channel.id}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-3 px-4 py-3 font-label-nav text-label-nav uppercase tracking-[0.1em] text-left text-on-primary hover:bg-on-primary/10 transition-colors cursor-pointer no-underline"
                >
                  {channel.id === 'facebook' && (
                    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold leading-none">
                      f
                    </span>
                  )}
                  {channel.id === 'whatsapp' && (
                    <MessageCircle size={18} strokeWidth={1.75} className="shrink-0" />
                  )}
                  {channel.id === 'email' && (
                    <Mail size={18} strokeWidth={1.75} className="shrink-0" />
                  )}
                  {channel.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
