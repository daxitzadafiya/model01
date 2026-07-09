'use client'

import React from 'react'

import DateRangePickerField from '@/components/PropertyList/DateRangePickerField'
import { useTranslation } from '@/utilities/translateClient'

export const defaultPeriodDateInputClassName =
  'w-full pl-10 pr-3 py-3 bg-surface-container-low border border-transparent focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface transition-colors'

type Props = {
  periodFrom: string
  periodTo: string
  onPeriodFromChange: (value: string) => void
  onPeriodToChange: (value: string) => void
  idPrefix?: string
  dateInputClassName?: string
}

export const PeriodFilterFields: React.FC<Props> = ({
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  idPrefix = 'period-filter',
  dateInputClassName,
}) => {
  const periodRangeLabel = useTranslation('propertyList.filters.periodRange', 'Stay period')

  return (
    <DateRangePickerField
      id={`${idPrefix}-period-range`}
      label={periodRangeLabel}
      periodFrom={periodFrom}
      periodTo={periodTo}
      onPeriodFromChange={onPeriodFromChange}
      onPeriodToChange={onPeriodToChange}
      triggerClassName={dateInputClassName ?? defaultPeriodDateInputClassName}
    />
  )
}
