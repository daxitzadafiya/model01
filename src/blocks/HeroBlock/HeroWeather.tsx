'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { PublicWeather } from '@/utilities/weather/types'

const DEFAULT_POLL_MINUTES = 5

type WeatherResponse = {
  enabled: boolean
  weather: PublicWeather | null
}

export const HeroWeather: React.FC = () => {
  const [weather, setWeather] = useState<PublicWeather | null>(null)
  const intervalRef = useRef<number | null>(null)

  const loadWeather = useCallback(async () => {
    try {
      const response = await fetch('/api/weather', { cache: 'no-store' })
      if (!response.ok) return

      const payload = (await response.json()) as WeatherResponse
      if (!payload.enabled || !payload.weather) {
        setWeather(null)
        return
      }

      setWeather(payload.weather)
    } catch {
      // Keep the last known weather reading when polling fails.
    }
  }, [])

  useEffect(() => {
    void loadWeather()

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [loadWeather])

  useEffect(() => {
    const intervalMinutes = weather?.refreshIntervalMinutes ?? DEFAULT_POLL_MINUTES

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
    }

    intervalRef.current = window.setInterval(() => {
      void loadWeather()
    }, intervalMinutes * 60 * 1000)

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [loadWeather, weather?.refreshIntervalMinutes])

  if (!weather) return null

  return (
    <div className="flex items-center gap-2 md:gap-3 py-3 md:py-4 px-4 md:px-6 text-white/90 shrink-0">
      {weather.conditionIcon ? (
        <img
          src={weather.conditionIcon}
          alt=""
          width={32}
          height={32}
          className="h-7 w-7 md:h-8 md:w-8 object-contain"
          aria-hidden
        />
      ) : null}
      <div className="text-right leading-tight">
        <p className="font-body-md text-body-md text-white">
          {weather.temperatureC}°C
          {weather.conditionText ? (
            <span className="hidden sm:inline text-white/75"> · {weather.conditionText}</span>
          ) : null}
        </p>
        <p className="font-label-sm text-label-sm text-white/70">
          {weather.locationName}
          {weather.country ? `, ${weather.country}` : ''}
        </p>
      </div>
    </div>
  )
}
