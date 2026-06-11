import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { crmServerFetch } from '@/utilities/crmServerFetch'
import { mapLocaleToBrochurePdfLang } from '@/utilities/propertyBrochure'

type SubmissionField = {
  field: string
  value: string | boolean
}

const CONTACT_SOURCE = 'web-client'

const FIRST_NAME_ALIASES = [
  'forename',
  'first_name',
  'first-name',
  'firstname',
  'firstName',
] as const

const FULL_NAME_ALIASES = ['full-name', 'full_name', 'fullname', 'fullName'] as const

const SURNAME_ALIASES = ['surname', 'last_name', 'last-name', 'lastname', 'lastName'] as const

const PASSTHROUGH_FIELDS = ['email', 'phone', 'subject', 'p_type', 'transaction_types'] as const

/** Fields sent to Optima as JSON booleans (not strings). */
const BOOLEAN_FIELDS = new Set(['gdpr_status'])

export async function buildAccountsIndexUrl(): Promise<string> {
  const settings = await getOptimaCrmSettings()
  const apiKey = settings.apiKey.trim()
  const contactUrl = settings.contactUrl.trim()

  if (!apiKey) {
    throw new Error('CRM API key is not configured. Set it under Globals → Optima CRM.')
  }

  const apiUrl = contactUrl
  if (!apiUrl) {
    throw new Error(
      'CRM contact URL is not configured. Set it under Globals → Optima CRM (Yii contact endpoint).',
    )
  }

  const base = apiUrl.replace(/\/+$/, '')

  if (base.includes('index.php')) {
    const joiner = base.includes('?') ? '&' : '?'
    return `${base}${joiner}r=accounts/index&user_apikey=${encodeURIComponent(apiKey)}&json=1`
  }

  return `${base}/accounts?user_apikey=${encodeURIComponent(apiKey)}&json=1`
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes'
    )
  }
  return Boolean(value)
}

function submissionDataToCrmPayload(
  submissionData?: SubmissionField[] | null,
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}

  for (const item of submissionData ?? []) {
    if (!item?.field) continue
    if (BOOLEAN_FIELDS.has(item.field)) {
      out[item.field] = toBoolean(item.value)
    } else {
      out[item.field] = item.value != null ? String(item.value) : ''
    }
  }

  return out
}

function pickStringField(
  payload: Record<string, string | boolean>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

/**
 * Maps contact and property-inquiry submissions to the Optima CRM accounts/index shape.
 */
function mapContactToOptimaPayload(
  payload: Record<string, string | boolean>,
  locale?: string,
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}

  const forename =
    pickStringField(payload, [...FIRST_NAME_ALIASES]) ??
    (!pickStringField(payload, [...SURNAME_ALIASES])
      ? pickStringField(payload, [...FULL_NAME_ALIASES])
      : undefined)

  const surname = pickStringField(payload, [...SURNAME_ALIASES])
  const message = pickStringField(payload, ['message', 'comments'])
  const property = pickStringField(payload, ['property', 'reference', '_id'])
  const toEmail = pickStringField(payload, ['to_email', 'assigned_to'])

  if (forename) out.forename = forename
  if (surname) out.surname = surname

  for (const key of PASSTHROUGH_FIELDS) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) out[key] = value.trim()
  }

  if (payload.gdpr_status !== undefined) {
    out.gdpr_status = toBoolean(payload.gdpr_status)
  }

  if (message) {
    out.message = message
    out.comments = message
  }

  if (property) out.property = property
  if (toEmail) out.to_email = toEmail

  if (locale?.trim()) {
    out.language = mapLocaleToBrochurePdfLang(locale)
  }

  return out
}

function formatOptimaMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    if (parts.length) return parts.join(' ')
  }
  return null
}

function extractOptimaErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>

  if (record.success === false) {
    return (
      formatOptimaMessage(record.error) ||
      formatOptimaMessage(record.message) ||
      formatOptimaMessage(record.msg) ||
      'CRM submission was rejected. Please check your details and try again.'
    )
  }

  if (record.status === 'error' || record.status === false) {
    return (
      formatOptimaMessage(record.error) ||
      formatOptimaMessage(record.message) ||
      'CRM submission was rejected. Please check your details and try again.'
    )
  }

  const directError = formatOptimaMessage(record.error)
  if (directError) return directError

  const errors = record.errors
  if (Array.isArray(errors) && errors.length > 0) {
    return formatOptimaMessage(errors[0]) || formatOptimaMessage(errors)
  }

  return null
}

async function parseOptimaCrmResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  let data: unknown = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!response.ok) {
        throw new Error(`CRM submission failed (${response.status}). Please try again later.`)
      }
      return text
    }
  }

  const optimaError = extractOptimaErrorMessage(data)

  if (!response.ok) {
    throw new Error(
      optimaError || `CRM submission failed (${response.status}). Please try again later.`,
    )
  }

  if (optimaError) {
    throw new Error(optimaError)
  }

  return data
}

/**
 * Forwards contact form fields to Optima CRM accounts/index.
 * Uses JSON so boolean fields (e.g. gdpr_status) are sent as true/false, not "true"/"false".
 */
export async function submitContactToOptimaCrm(
  submissionData?: SubmissionField[] | null,
  locale?: string,
): Promise<unknown> {
  const endpoint = await buildAccountsIndexUrl()
  const rawPayload = submissionDataToCrmPayload(submissionData)
  const payload = {
    ...mapContactToOptimaPayload(rawPayload, locale),
    source: CONTACT_SOURCE,
  }

  let response: Response

  try {
    response = await crmServerFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    const causeMessage =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
    const message = error instanceof Error ? error.message : 'CRM request failed'

    if (
      message.includes('unable to verify the first certificate') ||
      causeMessage.includes('unable to verify the first certificate')
    ) {
      throw new Error(
        'Could not connect to CRM due to an SSL certificate issue. For local development, restart the dev server after setting CRM_ALLOW_INSECURE_TLS=true in .env if the problem persists.',
      )
    }

    throw new Error(message)
  }

  return parseOptimaCrmResponse(response)
}
