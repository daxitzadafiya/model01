import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { PropertyFavoritesProvider } from './PropertyFavorites'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <PropertyFavoritesProvider>
        <HeaderThemeProvider>{children}</HeaderThemeProvider>
      </PropertyFavoritesProvider>
    </ThemeProvider>
  )
}
