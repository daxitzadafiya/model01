import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

export const Icon = (props: Props) => {
  const { className } = props

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt=""
      width={25}
      height={25}
      className={clsx('size-[25px]', className)}
      src="/site-favicon"
    />
  )
}

export default Icon
