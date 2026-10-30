'use client'

import React, { useId } from 'react'

import type { FlagCountry } from '@/i18n/locales'
import { cn } from '@/utilities/ui'

export type { FlagCountry }

type Props = {
  country: FlagCountry
  className?: string
  title?: string
}

/** Circular country flag (SVG) — matches horizon estates gold/cream theme */
export const FlagIcon: React.FC<Props> = ({ country, className, title }) => {
  const clipId = useId()

  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full',
        'ring-1 ring-outline-variant/40',
        className,
      )}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {country === 'gb' && <FlagGB clipId={clipId} />}
      {country === 'us' && <FlagUS clipId={clipId} />}
      {country === 'de' && <FlagDE clipId={clipId} />}
      {country === 'fr' && <FlagFR clipId={clipId} />}
      {country === 'es' && <FlagES clipId={clipId} />}
      {country === 'gr' && <FlagGR clipId={clipId} />}
      {country === 'it' && <FlagIT clipId={clipId} />}
      {country === 'nl' && <FlagNL clipId={clipId} />}
      {country === 'fi' && <FlagFI clipId={clipId} />}
      {country === 'ru' && <FlagRU clipId={clipId} />}
      {country === 'pl' && <FlagPL clipId={clipId} />}
      {country === 'ua' && <FlagUA clipId={clipId} />}
      {country === 'ro' && <FlagRO clipId={clipId} />}
      {country === 'tr' && <FlagTR clipId={clipId} />}
      {country === 'hu' && <FlagHU clipId={clipId} />}
      {country === 'se' && <FlagSE clipId={clipId} />}
      {country === 'cz' && <FlagCZ clipId={clipId} />}
      {country === 'pt' && <FlagPT clipId={clipId} />}
      {country === 'rs' && <FlagRS clipId={clipId} />}
      {country === 'bg' && <FlagBG clipId={clipId} />}
      {country === 'hr' && <FlagHR clipId={clipId} />}
      {country === 'dk' && <FlagDK clipId={clipId} />}
    </span>
  )
}

function FlagClip({ clipId, children, label }: { clipId: string; children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" role="img" aria-label={label}>
      <clipPath id={clipId}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{children}</g>
    </svg>
  )
}

function FlagGB({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="United Kingdom">
      <rect width="60" height="60" fill="#012169" />
      <path d="M0 0L60 60M60 0L0 60" stroke="#fff" strokeWidth="10" />
      <path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" strokeWidth="6" />
      <path d="M30 0V60M0 30H60" stroke="#fff" strokeWidth="16" />
      <path d="M30 0V60M0 30H60" stroke="#C8102E" strokeWidth="10" />
    </FlagClip>
  )
}

function FlagUS({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="United States">
      <rect width="60" height="60" fill="#B22234" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={i * 4.62} width="60" height="4.62" fill={i % 2 === 1 ? '#fff' : '#B22234'} />
      ))}
      <rect width="24" height="32" fill="#3C3B6E" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={4 + col * 5.5 + (row % 2) * 2.75}
            cy={4 + row * 5.5}
            r="1.1"
            fill="#fff"
          />
        )),
      )}
    </FlagClip>
  )
}

function FlagDE({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Germany">
      <rect width="60" height="20" y="0" fill="#000" />
      <rect width="60" height="20" y="20" fill="#DD0000" />
      <rect width="60" height="20" y="40" fill="#FFCE00" />
    </FlagClip>
  )
}

function FlagFR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="France">
      <rect width="20" height="60" fill="#002395" />
      <rect x="20" width="20" height="60" fill="#fff" />
      <rect x="40" width="20" height="60" fill="#ED2939" />
    </FlagClip>
  )
}

function FlagES({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Spain">
      <rect width="60" height="60" fill="#AA151B" />
      <rect y="15" width="60" height="30" fill="#F1BF00" />
    </FlagClip>
  )
}

function FlagGR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Greece">
      <rect width="60" height="60" fill="#0D5EAF" />
      <rect y="26" width="60" height="8" fill="#fff" />
      <rect x="26" width="8" height="60" fill="#fff" />
    </FlagClip>
  )
}

function FlagIT({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Italy">
      <rect width="20" height="60" fill="#009246" />
      <rect x="20" width="20" height="60" fill="#fff" />
      <rect x="40" width="20" height="60" fill="#CE2B37" />
    </FlagClip>
  )
}

function FlagNL({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Netherlands">
      <rect width="60" height="20" fill="#AE1C28" />
      <rect y="20" width="60" height="20" fill="#fff" />
      <rect y="40" width="60" height="20" fill="#21468B" />
    </FlagClip>
  )
}


function FlagFI({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Finland">
      <rect width="60" height="60" fill="#fff" />
      <rect x="16" width="10" height="60" fill="#003580" />
      <rect y="25" width="60" height="10" fill="#003580" />
    </FlagClip>
  )
}

function FlagRU({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Russia">
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#0039A6" />
      <rect y="40" width="60" height="20" fill="#D52B1E" />
    </FlagClip>
  )
}

function FlagPL({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Poland">
      <rect width="60" height="30" fill="#fff" />
      <rect y="30" width="60" height="30" fill="#DC143C" />
    </FlagClip>
  )
}

function FlagUA({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Ukraine">
      <rect width="60" height="30" fill="#0057B7" />
      <rect y="30" width="60" height="30" fill="#FFD700" />
    </FlagClip>
  )
}

function FlagRO({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Romania">
      <rect width="20" height="60" fill="#002B7F" />
      <rect x="20" width="20" height="60" fill="#FCD116" />
      <rect x="40" width="20" height="60" fill="#CE1126" />
    </FlagClip>
  )
}

function FlagTR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Turkey">
      <rect width="60" height="60" fill="#E30A17" />
      <circle cx="24" cy="30" r="12" fill="#fff" />
      <circle cx="28" cy="30" r="9.5" fill="#E30A17" />
      <polygon
        points="36,30 40.5,31.5 39,27.5 42.5,25 38.5,25 36,21.5 33.5,25 29.5,25 33,27.5 31.5,31.5"
        fill="#fff"
      />
    </FlagClip>
  )
}

function FlagHU({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Hungary">
      <rect width="60" height="20" fill="#CE2939" />
      <rect y="20" width="60" height="20" fill="#fff" />
      <rect y="40" width="60" height="20" fill="#477050" />
    </FlagClip>
  )
}

function FlagSE({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Sweden">
      <rect width="60" height="60" fill="#006AA7" />
      <rect x="18" width="10" height="60" fill="#FECC00" />
      <rect y="25" width="60" height="10" fill="#FECC00" />
    </FlagClip>
  )
}

function FlagCZ({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Czech Republic">
      <rect width="60" height="30" fill="#fff" />
      <rect y="30" width="60" height="30" fill="#D7141A" />
      <polygon points="0,0 30,30 0,60" fill="#11457E" />
    </FlagClip>
  )
}

function FlagPT({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Portugal">
      <rect width="24" height="60" fill="#006600" />
      <rect x="24" width="36" height="60" fill="#FF0000" />
      <circle cx="24" cy="30" r="8" fill="#FFCC00" />
      <circle cx="24" cy="30" r="5" fill="#FF0000" />
    </FlagClip>
  )
}

function FlagRS({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Serbia">
      <rect width="60" height="20" fill="#C6363C" />
      <rect y="20" width="60" height="20" fill="#0C4076" />
      <rect y="40" width="60" height="20" fill="#fff" />
    </FlagClip>
  )
}

function FlagBG({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Bulgaria">
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#00966E" />
      <rect y="40" width="60" height="20" fill="#D62612" />
    </FlagClip>
  )
}

function FlagHR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Croatia">
      <rect width="60" height="20" fill="#FF0000" />
      <rect y="20" width="60" height="20" fill="#fff" />
      <rect y="40" width="60" height="20" fill="#171796" />
    </FlagClip>
  )
}

function FlagDK({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Denmark">
      <rect width="60" height="60" fill="#C8102E" />
      <rect x="18" width="8" height="60" fill="#fff" />
      <rect y="26" width="60" height="8" fill="#fff" />
    </FlagClip>
  )
}
