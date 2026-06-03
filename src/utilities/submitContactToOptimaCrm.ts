type SubmissionField = {
  field: string
  value: string | boolean
}

const CONTACT_SOURCE = 'web-client'
const CONTACT_SCP = ''

/** Fields sent to Optima as JSON booleans (not strings). */
const BOOLEAN_FIELDS = new Set(['gdpr_status'])

export function buildAccountsIndexUrl(): string {
  const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY
  const contactUrl = process.env.NEXT_PUBLIC_CRM_API_URL_CONTACT?.trim()

  if (!apiKey) {
    throw new Error('CRM API key is not configured. Set NEXT_PUBLIC_CRM_API_KEY.')
  }

  const apiUrl = contactUrl
  if (!apiUrl) {
    throw new Error(
      'CRM contact URL is not configured. Set NEXT_PUBLIC_CRM_API_URL_CONTACT (Yii) or NEXT_PUBLIC_CRM_API_URL (v3).',
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
    return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes'
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
    const parts = value.filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    )
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

async function assertOptimaCrmSuccess(response: Response): Promise<void> {
  const text = await response.text()
  let data: unknown = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!response.ok) {
        throw new Error(`CRM submission failed (${response.status}). Please try again later.`)
      }
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
}

/**
 * Forwards contact form fields to Optima CRM accounts/index.
 * Uses JSON so boolean fields (e.g. gdpr_status) are sent as true/false, not "true"/"false".
 */
export async function submitContactToOptimaCrm(
  submissionData?: SubmissionField[] | null,
): Promise<void> {
  const endpoint = buildAccountsIndexUrl()
  const payload = {
    ...submissionDataToCrmPayload(submissionData),
    source: CONTACT_SOURCE,
    scp: CONTACT_SCP,
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  await assertOptimaCrmSuccess(response)
}
