'use client'

import type { NumberFieldClientComponent } from 'payload'
import { useField } from '@payloadcms/ui'
import { SelectInput } from '@payloadcms/ui/fields/Select'
import React, { useEffect, useMemo, useState } from 'react'

import {
  fetchCRMCities,
  fetchCRMCoasts,
  resolveLocationGroupKeys,
  type CRMCityOption,
} from '@/utilities/crmCoasts'

/**
 * City dropdown for city-wise listings — same CRM city API as the home filter.
 * Uses Payload SelectInput so it matches native admin select fields.
 */
export const CRMCityField: NumberFieldClientComponent = (props) => {
  const {
    field: { admin: { className, style } = {}, label, required } = {},
    path: pathFromProps,
    readOnly,
  } = props

  const { disabled, path, setValue, showError, value } = useField<number | null>({
    potentiallyStalePath: pathFromProps,
  })

  const [cities, setCities] = useState<CRMCityOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const coasts = await fetchCRMCoasts(undefined, { signal: controller.signal })
        const locationGroupKeys = resolveLocationGroupKeys([], coasts)
        const nextCities = await fetchCRMCities(locationGroupKeys, 'en', 'forSale', {
          signal: controller.signal,
        })
        setCities(nextCities)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM cities for admin city field', err)
        setCities([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const options = useMemo(
    () => cities.map((city) => ({ label: city.label, value: String(city.key) })),
    [cities],
  )

  const selected =
    value != null && Number.isFinite(Number(value)) ? String(value) : undefined

  return (
    <SelectInput
      className={className}
      isClearable
      label={label}
      name={path}
      onChange={(option) => {
        if (!option || Array.isArray(option)) {
          setValue(null)
          return
        }
        const next = typeof option.value === 'string' ? option.value.trim() : ''
        if (!next) {
          setValue(null)
          return
        }
        const parsed = Number(next)
        setValue(Number.isFinite(parsed) ? parsed : null)
      }}
      options={options}
      path={path}
      placeholder={loading ? 'Loading cities…' : 'Select a city…'}
      readOnly={Boolean(readOnly || disabled || loading)}
      required={required}
      showError={showError}
      style={style}
      value={selected}
    />
  )
}
