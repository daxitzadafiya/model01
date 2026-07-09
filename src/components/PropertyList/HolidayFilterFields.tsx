'use client'

import React from 'react'
import { Banknote, Users } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import type { PropertyListFilters } from '@/utilities/crmProperties'
import { PeriodFilterFields } from './PeriodFilterFields'
import { useGuestOptions, useHolidayBudgetOptions } from './useFilterOptionLabels'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  filters: Pick<PropertyListFilters, 'coast' | 'city' | 'periodFrom' | 'periodTo' | 'guests' | 'totalBudget'>
  onChange: <K extends keyof PropertyListFilters>(
    key: K,
    value: PropertyListFilters[K],
  ) => void
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
  idPrefix?: string
  dateInputClassName?: string
}

export const HolidayFilterFields: React.FC<Props> = ({
  filters,
  onChange,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
  idPrefix = 'holiday-filter',
  dateInputClassName,
}) => {
  const guestOptions = useGuestOptions()
  const holidayBudgetOptions = useHolidayBudgetOptions()

  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const totalBudgetLabel = useTranslation('propertyList.filters.totalBudget', 'Total Budget')

  return (
    <>
      <CoastCityFilterFields
        coast={filters.coast}
        city={filters.city}
        onCoastChange={(value) => onChange('coast', value)}
        onCityChange={(value) => onChange('city', value)}
        coasts={coasts}
        coastsLoading={coastsLoading}
        cities={cities}
        citiesLoading={citiesLoading}
        coastId={`${idPrefix}-coast`}
        cityId={`${idPrefix}-city`}
      />

      <PeriodFilterFields
        periodFrom={filters.periodFrom ?? ''}
        periodTo={filters.periodTo ?? ''}
        onPeriodFromChange={(value) => onChange('periodFrom', value)}
        onPeriodToChange={(value) => onChange('periodTo', value)}
        idPrefix={idPrefix}
        dateInputClassName={dateInputClassName}
      />

      <FilterSelect
        label={guestsLabel}
        id={`${idPrefix}-guests`}
        icon={<Users size={20} strokeWidth={1.75} />}
        options={guestOptions}
        value={filters.guests ?? 'any'}
        onChange={(value) => onChange('guests', value)}
      />

      <FilterSelect
        label={totalBudgetLabel}
        id={`${idPrefix}-budget`}
        icon={<Banknote size={20} strokeWidth={1.75} />}
        options={holidayBudgetOptions}
        value={filters.totalBudget ?? 'any'}
        onChange={(value) => onChange('totalBudget', value)}
      />
    </>
  )
}
