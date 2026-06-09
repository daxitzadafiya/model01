'use client'

import React from 'react'
import { Pencil } from 'lucide-react'

import type { DrawMode } from './types'

type Props = {
  drawMode: DrawMode
  drawButtonLabel: string
  drawInstructionText: string
  onStartDraw: () => void
  onApply: () => void
  onReset: () => void
}

export const PropertyMapDrawToolbar: React.FC<Props> = ({
  drawMode,
  drawButtonLabel,
  drawInstructionText,
  onStartDraw,
  onApply,
  onReset,
}) => {
  if (drawMode === 'idle') {
    return (
      <div className="absolute top-4 left-4 z-10">
        <button
          type="button"
          onClick={onStartDraw}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-sm text-label-sm uppercase tracking-widest text-on-primary shadow-lg hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer"
        >
          <Pencil size={16} aria-hidden />
          {drawButtonLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-primary/90 px-4 py-3 md:px-6">
      <div className="max-w-3xl">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary">
          {drawInstructionText}
        </p>
        {drawMode === 'drawing' && (
          <p className="mt-1 font-body-sm text-body-sm text-on-primary/80 normal-case tracking-normal">
            Click and drag on the map to draw your search area.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onApply}
          disabled={drawMode !== 'drawn'}
          className="rounded-lg bg-surface px-5 py-2 font-label-sm text-label-sm uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-on-primary px-5 py-2 font-label-sm text-label-sm uppercase tracking-widest text-on-primary hover:bg-primary/80 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
