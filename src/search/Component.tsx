'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/localePath'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const siteLocale = useSiteLocale()
  const locale: Locale = isLocale(siteLocale) ? siteLocale : 'en'

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(
      withLocalePrefix(`/search${debouncedValue ? `?q=${debouncedValue}` : ''}`, locale),
    )
  }, [debouncedValue, locale, router])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search"
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
