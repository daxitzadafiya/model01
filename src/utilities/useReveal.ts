'use client'

import { useEffect, useRef } from 'react'

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    const revealElements = element.querySelectorAll('.reveal')
    revealElements.forEach((el) => observer.observe(el))
    
    // Also observe the container itself if it has the reveal class
    if (element.classList.contains('reveal')) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return ref
}
