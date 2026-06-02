'use client'
import { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const CertificationRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['certifications']>[number]>()

  const label = data?.data?.icon
    ? `Certification ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data.data.icon}`
    : 'Row'

  return <div>{label}</div>
}
