import type { Form, FormSubmission } from '@/payload-types'
import type { Payload } from 'payload'

import { buildNotificationEmailHtml } from '@/email/buildNotificationEmailHtml'
import { getEmailSettings, isEmailConfigured } from '@/settings/email/server'
import { sendConfiguredEmail } from '@/email/sendConfiguredEmail'
import { t } from '@/utilities/translate'

type SubmissionField = {
  field: string
  value: string | boolean | number | null | undefined
}

type NotificationTemplate = 'contact' | 'propertyInquiry'

type NotificationField = {
  label: string
  value: string
}

type SendNotificationEmailArgs = {
  payload: Payload
  locale: string
  template: NotificationTemplate
  fields: NotificationField[]
  propertyReference?: string
  subjectSuffix?: string
}

const INTERNAL_FIELDS = new Set([
  '_id',
  'reference',
  'other_reference',
  'p_type',
  'interest',
  'assigned_to',
  'transaction_types',
  'scp',
  'gdpr_status',
  'recaptchaRequired',
  'recaptchaToken',
  'syncToOptimaCrm',
  'submissionLocale',
])

const EXCLUDED_FIELD_BLOCK_TYPES = new Set(['checkbox', 'message'])

const FIELD_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  'full-name': { key: 'email.notification.field.fullName', fallback: 'Full name' },
  forename: { key: 'email.notification.field.firstName', fallback: 'First name' },
  first_name: { key: 'email.notification.field.firstName', fallback: 'First name' },
  'first-name': { key: 'email.notification.field.firstName', fallback: 'First name' },
  firstname: { key: 'email.notification.field.firstName', fallback: 'First name' },
  surname: { key: 'email.notification.field.lastName', fallback: 'Last name' },
  last_name: { key: 'email.notification.field.lastName', fallback: 'Last name' },
  'last-name': { key: 'email.notification.field.lastName', fallback: 'Last name' },
  lastname: { key: 'email.notification.field.lastName', fallback: 'Last name' },
  email: { key: 'email.notification.field.email', fallback: 'Email' },
  phone: { key: 'email.notification.field.phone', fallback: 'Phone' },
  mobile_phone: { key: 'email.notification.field.phone', fallback: 'Phone' },
  subject: { key: 'email.notification.field.subject', fallback: 'Subject' },
  message: { key: 'email.notification.field.message', fallback: 'Message' },
  property: { key: 'email.notification.field.property', fallback: 'Property' },
}

function normalizeFieldName(fieldName: string): string {
  return fieldName.trim().toLowerCase().replace(/-/g, '_')
}

function getFieldLabelMapping(fieldName: string): { key: string; fallback: string } | undefined {
  return (
    FIELD_LABEL_KEYS[fieldName] ??
    FIELD_LABEL_KEYS[normalizeFieldName(fieldName)] ??
    FIELD_LABEL_KEYS[fieldName.trim().toLowerCase()]
  )
}

const TEMPLATE_DEFAULTS: Record<
  NotificationTemplate,
  { subject: string; heading: string; intro: string }
> = {
  contact: {
    subject: 'New Contact Request',
    heading: 'New Contact Request',
    intro: 'A new contact form submission has been received from your website.',
  },
  propertyInquiry: {
    subject: 'New Property Inquiry',
    heading: 'New Property Inquiry',
    intro: 'A new property inquiry has been received from your website.',
  },
}

function getSubmissionValue(
  submissionData: SubmissionField[] | null | undefined,
  fieldName: string,
): string {
  const entry = submissionData?.find((item) => item.field === fieldName)
  if (!entry) return ''

  const value = entry.value
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value).trim()
}

function isPropertyInquirySubmission(
  submissionData: SubmissionField[] | null | undefined,
): boolean {
  return Boolean(getSubmissionValue(submissionData, 'reference'))
}

function formatSubmittedAt(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  } catch {
    return new Date().toISOString()
  }
}

async function resolveFormTitle(payload: Payload, form: FormSubmission['form']): Promise<string> {
  if (typeof form === 'object' && form !== null && 'title' in form && form.title) {
    return form.title
  }

  if (typeof form === 'number') {
    try {
      const formDoc = await payload.findByID({
        collection: 'forms',
        id: form,
        depth: 0,
        overrideAccess: true,
      })
      return formDoc?.title ?? 'Form'
    } catch {
      return 'Form'
    }
  }

  return 'Form'
}

async function resolveFormDefinition(
  payload: Payload,
  form: FormSubmission['form'],
): Promise<Form | null> {
  if (typeof form === 'object' && form !== null && 'fields' in form) {
    return form as Form
  }

  if (typeof form === 'number') {
    try {
      return await payload.findByID({
        collection: 'forms',
        id: form,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return null
    }
  }

  return null
}

type FormField = NonNullable<Form['fields']>[number]

function getFormField(form: Form | null, fieldName: string): FormField | undefined {
  for (const field of form?.fields ?? []) {
    if (field && typeof field === 'object' && 'name' in field && field.name === fieldName) {
      return field
    }
  }

  return undefined
}

function getFieldLabelFromForm(form: Form | null, fieldName: string): string | undefined {
  const field = getFormField(form, fieldName)
  if (field && 'label' in field && typeof field.label === 'string' && field.label.trim()) {
    return field.label
  }

  return undefined
}

function isExcludedEmailField(fieldName: string, form: Form | null): boolean {
  if (INTERNAL_FIELDS.has(fieldName)) return true

  const field = getFormField(form, fieldName)
  if (
    field &&
    'blockType' in field &&
    typeof field.blockType === 'string' &&
    EXCLUDED_FIELD_BLOCK_TYPES.has(field.blockType)
  ) {
    return true
  }

  return false
}

async function formatPropertyReferenceForEmail(
  payload: Payload,
  locale: string,
  reference: string,
): Promise<string> {
  const refPrefix = (await t('propertyDetail.map.refPrefix', locale, 'Ref:', payload)).trim()
  const normalizedRef = reference.trim()

  return refPrefix.endsWith(':')
    ? `${refPrefix} ${normalizedRef}`
    : `${refPrefix}: ${normalizedRef}`
}

async function resolveFieldLabel(
  payload: Payload,
  fieldName: string,
  form: Form | null,
  locale: string,
): Promise<string> {
  const mapped = getFieldLabelMapping(fieldName)
  if (mapped) {
    return t(mapped.key, locale, mapped.fallback, payload)
  }

  const fromForm = getFieldLabelFromForm(form, fieldName)
  if (fromForm) {
    return t(
      `email.notification.formField.${normalizeFieldName(fieldName)}`,
      locale,
      fromForm,
      payload,
    )
  }

  return fieldName
}

async function sendNotificationEmail({
  payload,
  locale,
  template,
  fields,
  propertyReference,
  subjectSuffix,
}: SendNotificationEmailArgs): Promise<void> {
  const settings = await getEmailSettings()
  if (!isEmailConfigured(settings)) return

  const normalizedLocale = locale.trim().toLowerCase() || 'en'
  const templatePrefix = `email.notification.${template}`
  const defaults = TEMPLATE_DEFAULTS[template]

  const [logo, theme] = await Promise.all([
    payload.findGlobal({ slug: 'logo', depth: 1, overrideAccess: true }).catch(() => null),
    payload.findGlobal({ slug: 'theme', depth: 0, overrideAccess: true }).catch(() => null),
  ])

  const [subject, heading, intro, refLabel, submittedAtLabel, footer, siteName] = await Promise.all(
    [
      t(`${templatePrefix}.subject`, normalizedLocale, defaults.subject, payload),
      t(`${templatePrefix}.heading`, normalizedLocale, defaults.heading, payload),
      t(`${templatePrefix}.intro`, normalizedLocale, defaults.intro, payload),
      t('email.notification.refLabel', normalizedLocale, 'Property reference', payload),
      t('email.notification.submittedAt', normalizedLocale, 'Submitted at', payload),
      t(
        'email.notification.footer',
        normalizedLocale,
        'This message was sent automatically from your website contact system.',
        payload,
      ),
      t(
        'email.notification.siteName',
        normalizedLocale,
        settings.sender?.fromName ?? 'Horizon Estates',
        payload,
      ),
    ],
  )

  const formattedPropertyReference = propertyReference
    ? await formatPropertyReferenceForEmail(payload, normalizedLocale, propertyReference)
    : undefined

  const html = buildNotificationEmailHtml({
    heading,
    intro,
    fields,
    propertyReference: formattedPropertyReference,
    refLabel,
    submittedAtLabel,
    submittedAt: formatSubmittedAt(normalizedLocale),
    footer,
    logo,
    siteName,
    theme: theme?.colors,
  })

  const sender = settings.sender!
  const recipient = settings.notifications!.recipientAddress!
  const emailSubject = subjectSuffix ? `${subject} — ${subjectSuffix}` : subject

  await sendConfiguredEmail(payload, {
    to: recipient,
    subject: emailSubject,
    html,
    from: `${sender.fromName} <${sender.fromAddress}>`,
  })
}

export async function sendFormSubmissionNotificationEmail({
  payload,
  doc,
}: {
  payload: Payload
  doc: FormSubmission
}): Promise<void> {
  const submissionData = (doc.submissionData ?? []) as SubmissionField[]
  const locale = (doc.submissionLocale as string | undefined)?.trim().toLowerCase() || 'en'
  const isPropertyInquiry = isPropertyInquirySubmission(submissionData)
  const template: NotificationTemplate = isPropertyInquiry ? 'propertyInquiry' : 'contact'

  const [formTitle, formDefinition] = await Promise.all([
    resolveFormTitle(payload, doc.form),
    resolveFormDefinition(payload, doc.form),
  ])

  const visibleFields = submissionData.filter((entry) => {
    if (!entry?.field || isExcludedEmailField(entry.field, formDefinition)) return false
    return Boolean(getSubmissionValue(submissionData, entry.field))
  })

  const fields = await Promise.all(
    visibleFields.map(async (entry) => ({
      label: await resolveFieldLabel(payload, entry.field, formDefinition, locale),
      value: getSubmissionValue(submissionData, entry.field),
    })),
  )

  await sendNotificationEmail({
    payload,
    locale,
    template,
    fields,
    propertyReference: isPropertyInquiry
      ? getSubmissionValue(submissionData, 'reference')
      : undefined,
    subjectSuffix: formTitle,
  })
}
