'use client'

import React from 'react'

import { FilterSelect } from '@/components/FilterSelect'
import { COUNT_FILTER_OTHER_VALUE } from './filterOptions'

type Props = {
  label: string
  value: string
  customValue: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  onCustomChange: (value: string) => void
  icon?: React.ReactNode
  customPlaceholder?: string
  id?: string
}

const customInputClass =
  'w-full bg-surface-container-low border border-transparent focus:border-tertiary focus:ring-0 rounded-lg py-3 px-4 font-body-md text-body-md text-on-surface'

export const CountFilterField: React.FC<Props> = ({
  label,
  value,
  customValue,
  options,
  onChange,
  onCustomChange,
  icon,
  customPlaceholder = 'Enter number',
  id,
}) => {
  const showCustom = value === COUNT_FILTER_OTHER_VALUE

  const handleChange = (next: string) => {
    onChange(next)
    if (next !== COUNT_FILTER_OTHER_VALUE) onCustomChange('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <FilterSelect
        label={label}
        id={id}
        options={options}
        value={value}
        onChange={handleChange}
        icon={icon}
      />
      {showCustom && (
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value.replace(/\D/g, ''))}
          placeholder={customPlaceholder}
          className={customInputClass}
          aria-label={`${label} — custom value`}
        />
      )}
    </div>
  )
}
