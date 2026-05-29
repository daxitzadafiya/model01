'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'

type Props = Extract<Page['layout'][0], { blockType: 'statsBlock' }>

const DURATION_MS = 2200

type ParsedStat = {
  hasNumber: boolean
  prefix: string
  suffix: string
  end: number
  useCommas: boolean
  decimals: number
}

function parseStatValue(value: string): ParsedStat {
  const trimmed = value.trim()
  const useCommas = trimmed.includes(',')
  const normalized = trimmed.replace(/,/g, '')
  const match = normalized.match(/^([^\d]*)([\d.]+)(.*)$/)

  if (!match) {
    return {
      hasNumber: false,
      prefix: '',
      suffix: '',
      end: 0,
      useCommas: false,
      decimals: 0,
    }
  }

  const numericPart = match[2]
  const decimals = numericPart.includes('.') ? numericPart.split('.')[1].length : 0

  return {
    hasNumber: true,
    prefix: match[1],
    suffix: match[3],
    end: parseFloat(numericPart),
    useCommas,
    decimals,
  }
}

function formatCount(current: number, parsed: ParsedStat): string {
  const rounded =
    parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current))

  const [intPart, decPart] = rounded.split('.')
  const formattedInt = parsed.useCommas
    ? Number(intPart).toLocaleString('en-US')
    : intPart

  const numberStr = decPart ? `${formattedInt}.${decPart}` : formattedInt
  return `${parsed.prefix}${numberStr}${parsed.suffix}`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const AnimatedStatValue: React.FC<{ value: string }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const parsed = useMemo(() => parseStatValue(value), [value])
  const [display, setDisplay] = useState(() =>
    parsed.hasNumber ? formatCount(0, parsed) : value,
  )
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!parsed.hasNumber) {
      setDisplay(value)
      return
    }

    const el = ref.current
    if (!el) return

    setDisplay(formatCount(0, parsed))
    hasAnimated.current = false

    const runAnimation = () => {
      if (hasAnimated.current) return
      hasAnimated.current = true

      const start = performance.now()

      const tick = (now: number) => {
        const progress = Math.min((now - start) / DURATION_MS, 1)
        const eased = easeOutCubic(progress)
        const current = parsed.end * eased
        setDisplay(formatCount(current, parsed))

        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          setDisplay(formatCount(parsed.end, parsed))
        }
      }

      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [parsed, value])

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  )
}

export const StatsBlock: React.FC<Props> = ({ stats }) => {
  const ref = useReveal()

  return (
    <section ref={ref} className="py-12 md:py-20 bg-surface reveal">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
        {stats?.map((stat, i) => (
          <div key={i}>
            <h3 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-headline-lg text-tertiary mb-2">
              <AnimatedStatValue value={stat.value} />
            </h3>
            <p className="font-label-nav text-label-nav text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
