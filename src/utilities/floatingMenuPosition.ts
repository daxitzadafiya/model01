import type { CSSProperties } from 'react'

const DEFAULT_GAP = 4
const DEFAULT_MAX_HEIGHT = 280
const DEFAULT_VIEWPORT_PADDING = 12
/** Above modals (`z-[100]`) and modal footers */
export const FLOATING_MENU_Z_INDEX = 99999

export type FloatingMenuPlacement = 'auto' | 'top' | 'bottom'

export type FloatingMenuPositionInput = {
  triggerRect: DOMRect
  menuHeight?: number
  gap?: number
  maxMenuHeight?: number
  viewportPadding?: number
  minWidth?: number
  placement?: FloatingMenuPlacement
}

/**
 * Positions a portaled dropdown within the viewport.
 * Prefer `placement: 'top'` for fields at the bottom of modals.
 */
export function computeFloatingMenuStyle({
  triggerRect,
  menuHeight = 0,
  gap = DEFAULT_GAP,
  maxMenuHeight = DEFAULT_MAX_HEIGHT,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
  minWidth,
  placement = 'auto',
}: FloatingMenuPositionInput): CSSProperties {
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding
  const spaceAbove = triggerRect.top - viewportPadding
  const estimatedHeight = menuHeight > 0 ? menuHeight : maxMenuHeight

  const wouldOverflowBelow =
    triggerRect.bottom + gap + estimatedHeight > window.innerHeight - viewportPadding

  const openUp =
    placement === 'top' ||
    (placement === 'auto' &&
      (wouldOverflowBelow || spaceBelow < estimatedHeight) &&
      spaceAbove >= 120)

  const width = minWidth ? Math.max(triggerRect.width, minWidth) : triggerRect.width

  if (openUp) {
    const maxHeight = Math.max(120, Math.min(maxMenuHeight, spaceAbove - gap))

    return {
      position: 'fixed',
      left: triggerRect.left,
      width,
      bottom: window.innerHeight - triggerRect.top + gap,
      maxHeight,
      overflowY: 'auto',
      zIndex: FLOATING_MENU_Z_INDEX,
    }
  }

  const maxHeight = Math.max(120, Math.min(maxMenuHeight, spaceBelow - gap))

  return {
    position: 'fixed',
    top: triggerRect.bottom + gap,
    left: triggerRect.left,
    width,
    maxHeight,
    overflowY: 'auto',
    zIndex: FLOATING_MENU_Z_INDEX,
  }
}
