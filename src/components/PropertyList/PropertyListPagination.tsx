'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const formatPage = (n: number) => String(n).padStart(2, '0')

export const PropertyListPagination: React.FC<Props> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <section className="flex flex-col items-center gap-8 py-12 border-t border-outline-variant/30">
      <div className="flex items-center gap-8">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-tertiary hover:text-tertiary transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="font-body-md text-body-md flex items-center gap-3">
          <span className="text-on-surface-variant uppercase tracking-widest font-label-sm text-label-sm">
            Page
          </span>
          <span className="font-bold text-tertiary underline underline-offset-8">
            {formatPage(page)}
          </span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">{formatPage(totalPages)}</span>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-tertiary hover:text-tertiary transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  )
}
