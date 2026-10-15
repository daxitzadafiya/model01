'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

import { useTranslation } from '@/utilities/translateClient'

/** Plain-text length that reliably exceeds a three-line preview. */
const COLLAPSED_CHAR_LIMIT = 180

const descriptionClassName =
  'max-w-[68ch] space-y-3 text-[15px] leading-7 text-on-surface md:text-[17px] font-body-lg description-container'

const toPlainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

type Props = {
  description?: string
}

export const PropertyDetailDescription: React.FC<Props> = ({ description }) => {
  const readMoreLabel = useTranslation('propertyDetail.description.readMore', 'Read More')
  const readLessLabel = useTranslation('propertyDetail.description.readLess', 'Read Less')
  const contentRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const setContentNode = (node: HTMLElement | null) => {
    contentRef.current = node
  }
  const trimmed = description?.trim() ?? ''
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(
    () => toPlainText(trimmed).length > COLLAPSED_CHAR_LIMIT,
  )

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el || expanded) return

    const computed = window.getComputedStyle(el)
    const lineHeight = Number.parseFloat(computed.lineHeight)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return

    const snapshot = {
      display: el.style.display,
      overflow: el.style.overflow,
      webkitLineClamp: el.style.webkitLineClamp,
      webkitBoxOrient: el.style.webkitBoxOrient,
    }

    el.style.display = 'block'
    el.style.overflow = 'visible'
    el.style.webkitLineClamp = 'unset'
    el.style.webkitBoxOrient = 'horizontal'
    const fullHeight = el.getBoundingClientRect().height
    el.style.display = snapshot.display
    el.style.overflow = snapshot.overflow
    el.style.webkitLineClamp = snapshot.webkitLineClamp
    el.style.webkitBoxOrient = snapshot.webkitBoxOrient

    setOverflows(fullHeight > lineHeight * 3 + 1)
  }, [trimmed, expanded])

  if (!trimmed) return null

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed)
  const paragraphs = looksLikeHtml
    ? []
    : trimmed
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)

  const toggle = () => {
    if (!expanded) {
      setExpanded(true)
      return
    }

    const before = toggleRef.current?.getBoundingClientRect().top
    setExpanded(false)
    requestAnimationFrame(() => {
      if (before == null) return
      const after = toggleRef.current?.getBoundingClientRect().top
      if (after == null) return
      const delta = after - before
      if (Math.abs(delta) > 1) window.scrollBy(0, delta)
    })
  }

  const clamp = !expanded && overflows

  return (
    <div>
      {clamp ? (
        <p ref={setContentNode} className={`${descriptionClassName} line-clamp-3`}>
          {toPlainText(trimmed)}
        </p>
      ) : looksLikeHtml ? (
        <div
          ref={setContentNode}
          className={descriptionClassName}
          dangerouslySetInnerHTML={{ __html: trimmed }}
        />
      ) : (
        <div ref={setContentNode} className={descriptionClassName}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {overflows ? (
        <button
          ref={toggleRef}
          type="button"
          className="mt-3 cursor-pointer font-label-nav text-label-sm uppercase tracking-[0.14em] text-tertiary transition-colors duration-300 hover:text-primary"
          aria-expanded={expanded}
          onClick={toggle}
        >
          {expanded ? readLessLabel : readMoreLabel}
        </button>
      ) : null}
    </div>
  )
}
