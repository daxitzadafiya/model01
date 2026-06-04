import React from 'react'

import { PropertyFavoritesProvider } from './PropertyFavorites'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return <PropertyFavoritesProvider>{children}</PropertyFavoritesProvider>
}
