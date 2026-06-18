import * as React from 'react'

import { cn } from '@/utilities/ui'

import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  className?: string
  animationDelay?: number
}

export const PropertyCardSkeleton: React.FC<Props> = ({
  className,
  animationDelay = 0,
}) => (
  <div
    className={cn('space-y-4', className)}
    style={{ '--skeleton-delay': `${animationDelay}s` } as React.CSSProperties}
  >
    <Skeleton className="rounded-xl h-[280px] md:h-[400px]" />
    <Skeleton className="h-4 w-2/3 rounded" />
    <Skeleton className="h-6 w-full rounded" />
  </div>
)
