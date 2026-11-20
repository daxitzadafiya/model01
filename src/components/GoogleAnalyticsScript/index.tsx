import Script from 'next/script'

import type { PublicGoogleAnalyticsSettings } from '@/settings/integrations/shared'

type Props = {
  settings: PublicGoogleAnalyticsSettings
}

/**
 * Kill switch: tracking stays off regardless of admin settings until GA loading is
 * gated on the visitor's cookie-consent choice.
 */
const GOOGLE_ANALYTICS_RUNTIME_ENABLED = false

/**
 * Loads Google Analytics (gtag) from admin Integrations settings.
 * Admin pastes a Measurement ID or full gtag snippet; we only inject the official loader + config.
 */
export function GoogleAnalyticsScript({ settings }: Props) {
  if (!GOOGLE_ANALYTICS_RUNTIME_ENABLED) return null
  if (!settings.enabled || !settings.measurementId) return null

  const measurementId = settings.measurementId

  return (
    <>
      <Script
        id="google-analytics-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(measurementId)});`}
      </Script>
    </>
  )
}
