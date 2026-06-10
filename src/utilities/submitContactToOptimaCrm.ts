import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { crmServerFetch } from '@/utilities/crmServerFetch'

type SubmissionField = {
  field: string
  value: string | boolean
}

const CONTACT_SOURCE = 'web-client'
const CONTACT_SCP = ''

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
): Promise<unknown> {
  const endpoint = await buildAccountsIndexUrl()
  const payload = {
    ...submissionDataToCrmPayload(submissionData),
    source: CONTACT_SOURCE,
    scp: CONTACT_SCP,
  }
  console.log('payload', payload)

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
