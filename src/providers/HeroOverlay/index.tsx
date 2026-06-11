'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type HeroOverlayContextValue = {
  isHeroOverlay: boolean
  registerHeroOverlay: () => () => void
}

const HeroOverlayContext = createContext<HeroOverlayContextValue>({
  isHeroOverlay: false,
  registerHeroOverlay: () => () => {},
})

export const HeroOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0)

  const registerHeroOverlay = useCallback(() => {
    setCount((current) => current + 1)
    return () => setCount((current) => Math.max(0, current - 1))
  }, [])

  return (
    <HeroOverlayContext.Provider value={{ isHeroOverlay: count > 0, registerHeroOverlay }}>
      {children}
    </HeroOverlayContext.Provider>
  )
}

export const useHeroOverlay = () => useContext(HeroOverlayContext)

export const useRegisterHeroOverlay = () => {
  const { registerHeroOverlay } = useHeroOverlay()

  useEffect(() => registerHeroOverlay(), [registerHeroOverlay])
}

export const getHeaderNavLinkClass = (isActive: boolean, onDarkBackground: boolean) =>
  `font-label-nav text-label-nav font-medium transition-colors duration-300 ${
    onDarkBackground
      ? isActive
        ? 'text-tertiary'
        : 'text-white/90 hover:text-white'
      : isActive
        ? 'text-tertiary'
        : 'text-secondary hover:text-tertiary'
  }`
