'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Download, FileText } from 'lucide-react'

import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  groups: CRMPropertyDocumentGroup[]
}

function DocumentMenu({
  label,
  urls,
  openLabel,
}: {
  label: string
  urls: string[]
  openLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const estimatedItemHeight = 40
      const menuHeight = menuRef.current?.offsetHeight ?? urls.length * estimatedItemHeight + 2
      const gap = 4
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow
      const width = Math.max(rect.width, 180)

      setMenuStyle({
        position: 'fixed',
        left: Math.min(rect.left, window.innerWidth - width - 8),
        top: shouldOpenUp ? undefined : rect.bottom + gap,
        bottom: shouldOpenUp ? window.innerHeight - rect.top + gap : undefined,
        minWidth: width,
        zIndex: 80,
      })
    }

    updatePosition()

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, urls.length])

  if (urls.length === 1) {
    return (
      <a
        href={urls[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-label-sm font-label-sm text-on-surface transition-colors hover:bg-surface-container"
      >
        <Download size={14} aria-hidden />
        {openLabel}
      </a>
    )
  }

  const menu = open && mounted && (
    <div
      ref={menuRef}
      style={menuStyle}
      className="overflow-hidden rounded-md border border-outline-variant/40 bg-surface-bright shadow-lg"
      role="menu"
    >
      {urls.map((url, index) => (
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
          className="flex items-center gap-2 border-b border-outline-variant/20 px-3 py-2.5 text-left text-label-sm text-on-surface last:border-b-0 hover:bg-surface-container-low"
          onClick={() => setOpen(false)}
        >
          <FileText size={14} className="shrink-0 text-on-surface-variant" aria-hidden />
          {label} {index + 1}
        </a>
      ))}
    </div>
  )

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-label-sm font-label-sm text-on-surface transition-colors hover:bg-surface-container"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {openLabel}
        {urls.length > 1 ? (
          <span className="text-on-surface-variant">({urls.length})</span>
        ) : null}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

export const ProjectDetailDocuments: React.FC<Props> = ({ groups }) => {
  const heading = useTranslation('propertyDetail.documents.heading', 'Documents of interest')
  const floorPlansLabel = useTranslation('propertyDetail.documents.floorPlans', 'Floor plans')
  const qualityLabel = useTranslation('propertyDetail.documents.qualityReport', 'Quality report')
  const salesLabel = useTranslation('propertyDetail.documents.salesFile', 'Sales file')
  const otherLabel = useTranslation('propertyDetail.documents.other', 'Documents')
  const viewLabel = useTranslation('propertyDetail.documents.view', 'View')
  const downloadLabel = useTranslation('propertyDetail.documents.download', 'Download')
  const fileSingular = useTranslation('propertyDetail.documents.fileSingular', 'file')
  const filePlural = useTranslation('propertyDetail.documents.filePlural', 'files')

  if (groups.length === 0) return null

  const labelForKind = (kind: CRMPropertyDocumentGroup['kind'], fallback: string) => {
    switch (kind) {
      case 'floor_plan':
        return floorPlansLabel
      case 'quality_specification':
        return qualityLabel
      case 'sales_dossier':
        return salesLabel
      default:
        return otherLabel || fallback
    }
  }

  return (
    <section className="mb-10 md:mb-12">
      <div className="mb-6 border-b border-outline-variant/30 pb-4">
        <h2 className="text-headline-lg font-headline-lg text-primary">{heading}</h2>
      </div>

      <ul className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-bright divide-y divide-outline-variant/20">
        {groups.map((group) => {
          const label = labelForKind(group.kind, group.label)
          const actionLabel = group.urls.length > 1 ? viewLabel : downloadLabel

          return (
            <li
              key={group.kind}
              className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container-low text-on-surface-variant">
                  <FileText size={18} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-body-md text-body-md font-medium text-on-surface">
                    {label}
                  </p>
                  <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    {group.urls.length}{' '}
                    {group.urls.length === 1 ? fileSingular : filePlural}
                  </p>
                </div>
              </div>

              <DocumentMenu label={label} urls={group.urls} openLabel={actionLabel} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
