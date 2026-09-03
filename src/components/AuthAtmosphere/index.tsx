'use client'

import React from 'react'

/**
 * Soft atmosphere for admin auth pages — visual only.
 * Washes use Theme → --admin-* tokens (no photo bg).
 */
export default function AuthAtmosphere() {
  return (
    <div className="auth-atmosphere" aria-hidden>
      <span className="auth-atmosphere__wash auth-atmosphere__wash--a" />
      <span className="auth-atmosphere__wash auth-atmosphere__wash--b" />
      <span className="auth-atmosphere__wash auth-atmosphere__wash--c" />
      <span className="auth-atmosphere__rule auth-atmosphere__rule--top" />
      <span className="auth-atmosphere__rule auth-atmosphere__rule--bottom" />
      <span className="auth-atmosphere__mark" />
    </div>
  )
}
