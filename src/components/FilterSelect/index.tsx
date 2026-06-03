'use client'

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

import {
  computeFloatingMenuStyle,
  type FloatingMenuPlacement,
} from '@/utilities/floatingMenuPosition'
import { cn } from '@/utilities/ui'

export type FilterSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type BaseProps = {
  label: string
  options: readonly FilterSelectOption[]
  placeholder?: string
  /** Lucide icon (or any node) shown on the left of the trigger */
  icon?: React.ReactNode
  id?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  /** Prefer opening above the trigger (use for bottom-row modal fields). */
  menuPlacement?: FloatingMenuPlacement
}

export type FilterSelectSingleProps = BaseProps & {
  mode?: 'single'
  value: string
  onChange: (value: string) => void
}

export type FilterSelectMultiProps = BaseProps & {
  mode: 'multi'
  value: string[]
  onChange: (value: string[]) => void
  /** Label when no values are selected */
  emptyLabel?: string
  /** Max labels shown before switching to "N selected" */
  maxVisibleLabels?: number
}

export type FilterSelectProps = FilterSelectSingleProps | FilterSelectMultiProps

const fieldLabelClass = 'font-label-sm text-label-sm uppercase text-on-surface-variant ml-1'

const defaultTriggerClass =
  'w-full pl-10 pr-10 py-3 bg-surface-container-low border border-transparent focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface text-left'

export const FilterSelect: React.FC<FilterSelectProps> = (props) => {
  const {
    label,
    options,
    placeholder = 'Select…',
    icon,
    id: idProp,
    className,
    triggerClassName,
    disabled = false,
    menuPlacement = 'auto',
  } = props

  const generatedId = useId()
  const triggerId = idProp ?? generatedId
  const listboxId = `${triggerId}-listbox`

  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  const isMulti = props.mode === 'multi'
  const selectedValues = useMemo(
    () => (isMulti ? props.value : [props.value]),
    [isMulti, props.value],
  )

  const displayLabel = useMemo(() => {
    if (isMulti) {
      const multiProps = props as FilterSelectMultiProps
      if (selectedValues.length === 0) {
        return multiProps.emptyLabel ?? placeholder
      }

      const labels = selectedValues
        .map((value) => options.find((opt) => opt.value === value)?.label)
        .filter(Boolean) as string[]

      const maxVisible = multiProps.maxVisibleLabels ?? 2
      if (labels.length <= maxVisible) return labels.join(', ')
      return `${labels.length} selected`
    }

    const match = options.find((opt) => opt.value === props.value)
    return match?.label ?? placeholder
  }, [isMulti, options, placeholder, props, selectedValues])

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 0
      setMenuStyle(
        computeFloatingMenuStyle({
          triggerRect: rect,
          menuHeight,
          placement: menuPlacement,
        }),
      )
    }

    updatePosition()

    let resizeObserver: ResizeObserver | null = null
    const raf = requestAnimationFrame(() => {
      updatePosition()
      if (typeof ResizeObserver !== 'undefined' && menuRef.current) {
        resizeObserver = new ResizeObserver(updatePosition)
        resizeObserver.observe(menuRef.current)
      }
    })

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length, menuPlacement])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const isSelected = (value: string) => selectedValues.includes(value)

  const handleSelect = (value: string) => {
    if (disabled) return
    const option = options.find((opt) => opt.value === value)
    if (option?.disabled) return

    if (isMulti) {
      const current = props.value
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      props.onChange(next)
      return
    }

    props.onChange(value)
    setOpen(false)
  }

  const menu = open ? (
    <ul
      ref={menuRef}
      id={listboxId}
      role="listbox"
      aria-multiselectable={isMulti || undefined}
      aria-label={label}
      style={menuStyle}
      className={cn(
        'overflow-y-auto overscroll-contain rounded-lg border border-outline-variant/40',
        'bg-surface py-1 shadow-lg',
      )}
    >
      {options.map((option) => {
        const selected = isSelected(option.value)

        return (
          <li key={option.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              disabled={option.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-left font-body-md text-body-md transition-colors duration-150',
                selected
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface hover:bg-surface-container-low',
                option.disabled && 'cursor-not-allowed opacity-50',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(option.value)}
            >
              {isMulti && (
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    selected
                      ? 'border-on-primary bg-on-primary/10'
                      : 'border-outline-variant bg-surface',
                  )}
                  aria-hidden
                >
                  {selected && <Check size={12} strokeWidth={3} />}
                </span>
              )}
              <span className="flex-1 truncate">{option.label}</span>
              {!isMulti && selected && (
                <Check size={16} className="shrink-0 opacity-90" aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  ) : null

  return (
    <div ref={rootRef} className={cn('relative flex flex-col gap-2', className)}>
      <label className={fieldLabelClass} htmlFor={triggerId}>
        {label}
      </label>

      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={cn(
          defaultTriggerClass,
          'relative transition-colors duration-200',
          disabled && 'cursor-not-allowed opacity-60',
          open && 'border-tertiary',
          triggerClassName,
        )}
        onClick={() => setOpen((current) => !current)}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="block truncate">{displayLabel}</span>
        <ChevronDown
          size={20}
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

export default FilterSelect
