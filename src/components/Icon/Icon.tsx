'use client'

import clsx from 'clsx'
import React, { useEffect, useState } from 'react'

import { DEFAULT_FAVICON, getFaviconSource } from '@/components/Logo/getLogoSources'
import type { Logo as LogoGlobal } from '@/payload-types'

interface Props {
  className?: string
}

export const Icon = (props: Props) => {
  const { className } = props
  const [faviconSrc, setFaviconSrc] = useState(DEFAULT_FAVICON)

  useEffect(() => {
    let isCancelled = false

    const loadFavicon = async () => {
      try {
        const response = await fetch('/api/globals/logo?depth=1')
        if (!response.ok) return

        const logoData = (await response.json()) as LogoGlobal
        if (!isCancelled) {
          setFaviconSrc(getFaviconSource(logoData))
        }
      } catch {
        // Keep fallback favicon if request fails
      }
    }

    void loadFavicon()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt=""
      width={25}
      height={25}
      className={clsx('size-[25px]', className)}
      src={faviconSrc}
    />
  )
}

export default Icon
