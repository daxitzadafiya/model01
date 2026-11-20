import type { IntegrationsSetting } from '@/payload-types'

export type WhatsAppPosition = 'left' | 'right'

export type PublicWhatsAppSettings = {
  enabled: boolean
  phoneNumber: string
  position: WhatsAppPosition
  /** Digits-only number for https://wa.me/{digits} */
  waMeUrl: string | null
}

export type PublicVirtualAssistantSettings = {
  enabled: boolean
  scriptSrc: string
  agencyKey: string
}

export type PublicGoogleAnalyticsSettings = {
  enabled: boolean
  /** GA4 / UA / GT measurement ID, e.g. G-XXXXXXXX */
  measurementId: string
}

export type ResolvedIntegrationsSettings = {
  googleMapsApiKey: string
  recaptchaSiteKey: string
  recaptchaSecretKey: string
  whatsapp: PublicWhatsAppSettings
  virtualAssistant: PublicVirtualAssistantSettings
  googleAnalytics: PublicGoogleAnalyticsSettings
}

export type PublicIntegrationsSettings = Pick<
  ResolvedIntegrationsSettings,
  'googleMapsApiKey' | 'recaptchaSiteKey' | 'whatsapp' | 'virtualAssistant' | 'googleAnalytics'
>

export const EMPTY_WHATSAPP_SETTINGS: PublicWhatsAppSettings = {
  enabled: false,
  phoneNumber: '',
  position: 'right',
  waMeUrl: null,
}

export const EMPTY_VIRTUAL_ASSISTANT_SETTINGS: PublicVirtualAssistantSettings = {
  enabled: false,
  scriptSrc: '',
  agencyKey: '',
}

export const EMPTY_GOOGLE_ANALYTICS_SETTINGS: PublicGoogleAnalyticsSettings = {
  enabled: false,
  measurementId: '',
}

export const EMPTY_INTEGRATIONS_SETTINGS: ResolvedIntegrationsSettings = {
  googleMapsApiKey: '',
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
  whatsapp: EMPTY_WHATSAPP_SETTINGS,
  virtualAssistant: EMPTY_VIRTUAL_ASSISTANT_SETTINGS,
  googleAnalytics: EMPTY_GOOGLE_ANALYTICS_SETTINGS,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

/** Normalize to digits only for wa.me (strips +, spaces, dashes). */
export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function buildWhatsAppMeUrl(phone: string): string | null {
  const digits = normalizeWhatsAppPhone(phone)
  if (!digits) return null
  return `https://wa.me/${digits}`
}

/**
 * Parse an Optima webchat embed tag into src + agency key.
 * Example: <script src="https://webchat-api.optimasit.com/widget.js" data-agency-key="…" async></script>
 */
export function parseVirtualAssistantEmbedScript(raw: string): {
  scriptSrc: string
  agencyKey: string
} | null {
  const text = raw.trim()
  if (!text) return null

  const srcMatch = text.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
  const agencyMatch = text.match(/\bdata-agency-key\s*=\s*["']([^"']+)["']/i)
  const scriptSrc = srcMatch?.[1]?.trim() ?? ''
  const agencyKey = agencyMatch?.[1]?.trim() ?? ''

  if (!scriptSrc || !agencyKey) return null
  if (!/^https:\/\//i.test(scriptSrc)) return null

  return { scriptSrc, agencyKey }
}

export function resolveWhatsAppSettings(
  whatsapp: IntegrationsSetting['whatsapp'] | null | undefined,
): PublicWhatsAppSettings {
  const phoneNumber = pickString(whatsapp?.phoneNumber, '')
  const position = whatsapp?.position === 'left' ? 'left' : 'right'
  const enabled = whatsapp?.enabled === true && Boolean(normalizeWhatsAppPhone(phoneNumber))

  return {
    enabled,
    phoneNumber,
    position,
    waMeUrl: enabled ? buildWhatsAppMeUrl(phoneNumber) : null,
  }
}

export function resolveVirtualAssistantSettings(
  virtualAssistant: IntegrationsSetting['virtualAssistant'] | null | undefined,
): PublicVirtualAssistantSettings {
  const embedScript = pickString(virtualAssistant?.embedScript, '')
  const parsed = parseVirtualAssistantEmbedScript(embedScript)
  const enabled = virtualAssistant?.enabled === true && parsed !== null

  return {
    enabled,
    scriptSrc: enabled && parsed ? parsed.scriptSrc : '',
    agencyKey: enabled && parsed ? parsed.agencyKey : '',
  }
}

/**
 * Accept a bare Measurement ID or a full Google Analytics / gtag snippet.
 * Returns the first valid G- / GT- / UA- id found.
 */
export function parseGoogleAnalyticsEmbedScript(raw: string): { measurementId: string } | null {
  const text = raw.trim()
  if (!text) return null

  const bare = text.match(/^(G-[A-Z0-9]+|GT-[A-Z0-9]+|UA-\d+-\d+)$/i)
  if (bare?.[1]) {
    return { measurementId: normalizeGaId(bare[1]) }
  }

  const fromQuery = text.match(/[?&]id=(G-[A-Z0-9]+|GT-[A-Z0-9]+|UA-\d+-\d+)/i)
  if (fromQuery?.[1]) {
    return { measurementId: normalizeGaId(fromQuery[1]) }
  }

  const fromConfig = text.match(
    /gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+|GT-[A-Z0-9]+|UA-\d+-\d+)['"]/i,
  )
  if (fromConfig?.[1]) {
    return { measurementId: normalizeGaId(fromConfig[1]) }
  }

  const anyId = text.match(/\b(G-[A-Z0-9]+|GT-[A-Z0-9]+|UA-\d+-\d+)\b/i)
  if (anyId?.[1]) {
    return { measurementId: normalizeGaId(anyId[1]) }
  }

  return null
}

function normalizeGaId(value: string): string {
  const trimmed = value.trim()
  if (/^UA-/i.test(trimmed)) {
    const match = trimmed.match(/^UA-(\d+)-(\d+)$/i)
    return match ? `UA-${match[1]}-${match[2]}` : trimmed
  }
  return trimmed.toUpperCase()
}

export function resolveGoogleAnalyticsSettings(
  googleAnalytics: IntegrationsSetting['googleAnalytics'] | null | undefined,
): PublicGoogleAnalyticsSettings {
  const embedScript = pickString(googleAnalytics?.embedScript, '')
  const parsed = parseGoogleAnalyticsEmbedScript(embedScript)
  const enabled = googleAnalytics?.enabled === true && parsed !== null

  return {
    enabled,
    measurementId: enabled && parsed ? parsed.measurementId : '',
  }
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
    whatsapp: resolveWhatsAppSettings(doc?.whatsapp),
    virtualAssistant: resolveVirtualAssistantSettings(doc?.virtualAssistant),
    googleAnalytics: resolveGoogleAnalyticsSettings(doc?.googleAnalytics),
  }
}

export function toPublicIntegrationsSettings(
  settings: ResolvedIntegrationsSettings,
): PublicIntegrationsSettings {
  return {
    googleMapsApiKey: settings.googleMapsApiKey,
    recaptchaSiteKey: settings.recaptchaSiteKey,
    whatsapp: settings.whatsapp,
    virtualAssistant: settings.virtualAssistant,
    googleAnalytics: settings.googleAnalytics,
  }
}
