'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  readFavoriteIdsFromDocument,
  toggleFavoriteId,
  writeFavoriteIdsToDocument,
  type FavoritePropertyId,
} from '@/utilities/propertyFavorites'

type PropertyFavoritesContextValue = {
  favoriteIds: FavoritePropertyId[]
  count: number
  isFavorite: (id: FavoritePropertyId | undefined | null) => boolean
  toggleFavorite: (id: FavoritePropertyId) => void
}

const PropertyFavoritesContext = createContext<PropertyFavoritesContextValue | null>(null)

export const PropertyFavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<FavoritePropertyId[]>([])

  useEffect(() => {
    setFavoriteIds(readFavoriteIdsFromDocument())
  }, [])

  const isFavorite = useCallback(
    (id: FavoritePropertyId | undefined | null) => {
      if (id === undefined || id === null || id === '') return false
      return favoriteIds.some((entry) => String(entry) === String(id))
    },
    [favoriteIds],
  )

  const toggleFavorite = useCallback((id: FavoritePropertyId) => {
    setFavoriteIds((prev) => {
      const next = toggleFavoriteId(prev, id)
      writeFavoriteIdsToDocument(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      favoriteIds,
      count: favoriteIds.length,
      isFavorite,
      toggleFavorite,
    }),
    [favoriteIds, isFavorite, toggleFavorite],
  )

  return (
    <PropertyFavoritesContext.Provider value={value}>
      {children}
    </PropertyFavoritesContext.Provider>
  )
}

export function usePropertyFavorites(): PropertyFavoritesContextValue {
  const context = useContext(PropertyFavoritesContext)
  if (!context) {
    throw new Error('usePropertyFavorites must be used within PropertyFavoritesProvider')
  }
  return context
}
