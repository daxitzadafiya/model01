import React from 'react'

type Props = {
  prefix: string
  reference: string
  className?: string
}

export const DetailReference: React.FC<Props> = ({ prefix, reference, className = '' }) => {
  const value = reference.trim()
  if (!value) return null

  return (
    <p
      className={`font-label-md text-label-md uppercase whitespace-nowrap shrink-0 mb-3 leading-[1] md:leading-tight text-tertiary min-w-0 py-2 border-y border-tertiary border-dashed font-normal ${className}`.trim()}
    >
      {prefix} {value}
    </p>
  )
}
