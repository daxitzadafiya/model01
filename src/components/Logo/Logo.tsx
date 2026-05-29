import clsx from 'clsx'
import React from 'react'

import styles from './Logo.module.css'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

const logoProps = {
  alt: 'Roumpos',
  width: 193,
  height: 34,
  decoding: 'async' as const,
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <span className={clsx('inline-block max-w-[9.375rem] w-full', className)}>
      {/* eslint-disable @next/next/no-img-element */}
      <img
        {...logoProps}
        className={clsx(styles.logo, styles.light)}
        fetchPriority={priority}
        loading={loading}
        src="/logo.png"
      />
      <img
        {...logoProps}
        className={clsx(styles.logo, styles.dark)}
        fetchPriority={priority}
        loading={loading}
        src="/logow.png"
      />
    </span>
  )
}

export default Logo
