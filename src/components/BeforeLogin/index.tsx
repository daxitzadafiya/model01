import React from 'react'

import AuthAtmosphere from '@/components/AuthAtmosphere'

/**
 * Injected above the login form (inside MinimalTemplate).
 * Atmosphere only — does not alter auth behaviour.
 */
const BeforeLogin: React.FC = () => {
  return <AuthAtmosphere />
}

export default BeforeLogin
