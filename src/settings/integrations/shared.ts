import type { IntegrationsSetting } from '@/payload-types'

export type ResolvedIntegrationsSettings = {
  googleMapsApiKey: string
  recaptchaSiteKey: string
  recaptchaSecretKey: string
}

export type PublicIntegrationsSettings = Pick<
  ResolvedIntegrationsSettings,
  'googleMapsApiKey' | 'recaptchaSiteKey'
>

export const EMPTY_INTEGRATIONS_SETTINGS: ResolvedIntegrationsSettings = {
  googleMapsApiKey: '',
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

export function resolveIntegrationsSettingsFromGlobal(
  doc: IntegrationsSetting | null | undefined,
): ResolvedIntegrationsSettings {
  const googleMaps = doc?.googleMaps
  const recaptcha = doc?.recaptcha
  const defaults = EMPTY_INTEGRATIONS_SETTINGS

  return {
    googleMapsApiKey: pickString(googleMaps?.apiKey, defaults.googleMapsApiKey),
    recaptchaSiteKey: pickString(recaptcha?.siteKey, defaults.recaptchaSiteKey),
    recaptchaSecretKey: pickString(recaptcha?.secretKey, defaults.recaptchaSecretKey),
  }
}

export function toPublicIntegrationsSettings(
  settings: ResolvedIntegrationsSettings,
): PublicIntegrationsSettings {
  return {
    googleMapsApiKey: settings.googleMapsApiKey,
    recaptchaSiteKey: settings.recaptchaSiteKey,
  }
}
