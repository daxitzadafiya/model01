'use client'

import React, { useState } from 'react'
import { ChevronDown, Download, FileText } from 'lucide-react'

import { useDocumentDownload } from '@/components/DocumentDownload/DocumentDownloadProvider'
import { downloadKindFromDocumentGroup } from '@/utilities/documentDownload'
import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  groups: CRMPropertyDocumentGroup[]
}

export const PropertyDetailDocuments: React.FC<Props> = ({ groups }) => {
  const { requestDownload } = useDocumentDownload()
  const heading = useTranslation('propertyDetail.documents.heading', 'Documents of interest')
  const floorPlansLabel = useTranslation('propertyDetail.documents.floorPlans', 'Floor plans')
  const qualityLabel = useTranslation('propertyDetail.documents.qualityReport', 'Quality report')
  const salesLabel = useTranslation('propertyDetail.documents.salesFile', 'Sales file')
  const otherLabel = useTranslation('propertyDetail.documents.other', 'Documents')
  const downloadLabel = useTranslation('propertyDetail.documents.download', 'Download')

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
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          className="block w-full cursor-pointer border-b border-outline-variant/20 px-4 py-2.5 text-left text-body-sm font-body-sm text-on-surface last:border-b-0 hover:bg-surface-container-low"
                          onClick={(event) => {
                            event.currentTarget.closest('details')?.removeAttribute('open')
                            requestDownload({
                              url,
                              actionLabel: downloadLabel,
                              documentLabel: `${label} ${index + 1}`,
                              kind: downloadKindFromDocumentGroup(group.kind),
                            })
                          }}
                        >
                          {label} {index + 1}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )
            }

            return (
              <button
                key={group.kind}
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 bg-surface-bright px-5 py-3 font-label-nav text-label-nav uppercase text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary"
                onClick={() =>
                  requestDownload({
                    url: group.urls[0],
                    actionLabel: downloadLabel,
                    documentLabel: label,
                    kind: downloadKindFromDocumentGroup(group.kind),
                  })
                }
              >
                <Download size={18} aria-hidden />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
