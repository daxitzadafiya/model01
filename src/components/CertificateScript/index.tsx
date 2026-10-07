'use client'

import { useEffect, useRef } from 'react'

const SCRIPT_ATTRS = new Set([
  'src',
  'async',
  'defer',
  'type',
  'id',
  'nomodule',
  'crossorigin',
  'integrity',
  'referrerpolicy',
  'nonce',
  'charset',
  'fetchpriority',
])

function isHttpSrc(src: string): boolean {
  return /^https?:\/\//i.test(src.trim())
}

/**
 * Mount one pasted certificate <script> tag as a real script node.
 * React does not execute scripts inserted as HTML, and other markup in the
 * field is ignored.
 */
function mountCertificateScript(raw: string, host: HTMLElement): void {
  const text = raw.trim()
  if (!text) return

  const doc = new DOMParser().parseFromString(text, 'text/html')
  const scripts = doc.querySelectorAll('script')
  if (scripts.length !== 1) return

  const source = scripts[0]
  const src = source.getAttribute('src')
  if (src && !isHttpSrc(src)) return

  const el = document.createElement('script')
  for (const attr of source.attributes) {
    const name = attr.name.toLowerCase()
    if (name.startsWith('on')) continue
    if (name.startsWith('data-') || SCRIPT_ATTRS.has(name)) {
      el.setAttribute(attr.name, attr.value)
    }
  }
  if (source.text) {
    el.text = source.text
  }
  host.appendChild(el)
}

type Props = {
  script: string
  className?: string
}

export function CertificateScript({ script, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.replaceChildren()
    mountCertificateScript(script, host)

    return () => {
      host.replaceChildren()
    }
  }, [script])

  return <div ref={hostRef} className={className} />
}
