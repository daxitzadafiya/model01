'use client'

import React, { useState } from 'react'
import { ChevronDown, Download, FileText } from 'lucide-react'

import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  groups: CRMPropertyDocumentGroup[]
}

export const PropertyDetailDocuments: React.FC<Props> = ({ groups }) => {
  const heading = useTranslation('propertyDetail.documents.heading', 'Documents of interest')
  const floorPlansLabel = useTranslation('propertyDetail.documents.floorPlans', 'Floor plans')
  const qualityLabel = useTranslation('propertyDetail.documents.qualityReport', 'Quality report')
  const salesLabel = useTranslation('propertyDetail.documents.salesFile', 'Sales file')
  const otherLabel = useTranslation('propertyDetail.documents.other', 'Documents')

  const [open, setOpen] = useState(true)

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
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mb-6 flex w-full items-center justify-between gap-3 border-b border-outline-variant/30 pb-4 text-left"
        aria-expanded={open}
      >
        <h2 className="text-headline-lg font-headline-lg text-primary">{heading}</h2>
        <ChevronDown
          size={22}
          className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="flex flex-wrap gap-3">
          {groups.map((group) => {
            const label = labelForKind(group.kind, group.label)
            const multi = group.urls.length > 1

            if (multi) {
              return (
                <div key={group.kind} className="relative inline-flex">
                  <details className="group/details">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-primary/30 bg-surface-bright px-5 py-3 font-label-nav text-label-nav uppercase text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary [&::-webkit-details-marker]:hidden">
                      <FileText size={18} aria-hidden />
                      <span>
                        {label} ({group.urls.length})
                      </span>
                      <ChevronDown
                        size={14}
                        className="transition-transform group-open/details:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[12rem] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-bright shadow-lg">
                      {group.urls.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border-b border-outline-variant/20 px-4 py-2.5 text-body-sm font-body-sm text-on-surface last:border-b-0 hover:bg-surface-container-low"
                        >
                          {label} {index + 1}
                        </a>
                      ))}
                    </div>
                  </details>
                </div>
              )
            }

            return (
              <a
                key={group.kind}
                href={group.urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface-bright px-5 py-3 font-label-nav text-label-nav uppercase text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary"
              >
                <Download size={18} aria-hidden />
                <span>{label}</span>
              </a>
            )
          })}
        </div>
      )}
    </section>
  )
}
