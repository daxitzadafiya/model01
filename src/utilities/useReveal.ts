'use client'

import { useEffect, useRef } from 'react'

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const isVisible = (el: Element) => {
      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      return rect.top < viewportHeight * 0.95 && rect.bottom > 0
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.01,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    const revealElements = Array.from(element.querySelectorAll('.reveal'))
    if (element.classList.contains('reveal')) revealElements.push(element)

    revealElements.forEach((el) => {
      if (isVisible(el)) {
        el.classList.add('active')
        return
      }
      observer.observe(el)
    })

    const rafId = window.requestAnimationFrame(() => {
      revealElements.forEach((el) => {
        if (!el.classList.contains('active') && isVisible(el)) {
          el.classList.add('active')
          observer.unobserve(el)
        }
      })
    })

    // Failsafe: prevent hidden blank sections if observer misses any element
    const timeoutId = window.setTimeout(() => {
      revealElements.forEach((el) => {
        if (!el.classList.contains('active')) {
          el.classList.add('active')
          observer.unobserve(el)
        }
      })
    }, 1200)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return ref
}
