import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { EmailSetting, Form, FormSubmission } from '@/payload-types'
import type { Locale } from '@/i18n/locales'
import type { Payload } from 'payload'

import { buildClientConfirmationEmailHtml } from '@/email/buildClientConfirmationEmailHtml'
import { buildNotificationEmailHtml } from '@/email/buildNotificationEmailHtml'
import { lexicalToEmailHtml } from '@/email/lexicalToEmailHtml'
import { getEmailSettings, isEmailConfigured } from '@/settings/email/server'
import { sendConfiguredEmail } from '@/email/sendConfiguredEmail'
import { getEmailFieldLabelMapping } from '@/utilities/formFieldLabels'
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

type EmailTemplateConfig = {
  subject?: string | null
  content?: SerializedEditorState | null
}

type SendNotificationEmailArgs = {
  payload: Payload
  locale: string
  template: NotificationTemplate
  fields: NotificationField[]
  propertyReference?: string
  subjectSuffix?: string
  clientEmail?: string
}

const INTERNAL_FIELDS = new Set([
  '_id',
  'reference',
  'property',
  'other_reference',
  'p_type',
  'interest',
  'assigned_to',
  'to_email',
  'transaction_types',
  'scp',
  'gdpr_status',
  'language',
  'comments',
  'recaptchaRequired',
  'recaptchaToken',
  'syncToOptimaCrm',
  'submissionLocale',
])

const EXCLUDED_FIELD_BLOCK_TYPES = new Set(['checkbox', 'message'])

const EMAIL_FIELD_NAMES = new Set(['email', 'e-mail', 'client_email', 'client-email'])

const TEMPLATE_DEFAULTS: Record<
  NotificationTemplate,
  { subject: string; name: string; intro: string }
> = {
  contact: {
    subject: 'New Contact Request',
    name: 'New Contact Request',
    intro: 'A new contact form submission has been received from your website.',
  },
  propertyInquiry: {
    subject: 'New Property Inquiry',
    name: 'New Property Inquiry',
    intro: 'A new property inquiry has been received from your website.',
  },
}

const CLIENT_TEMPLATE_DEFAULTS: Record<NotificationTemplate, { subject: string }> = {
  contact: {
    subject: 'Thank you for your enquiry',
  },
  propertyInquiry: {
    subject: 'Enquiry about property (Ref: {{reference}})',
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
  return Boolean(
    getSubmissionValue(submissionData, 'property') || getSubmissionValue(submissionData, 'reference'),
  )
}

function getClientEmail(submissionData: SubmissionField[] | null | undefined): string | undefined {
  for (const entry of submissionData ?? []) {
    const fieldName = entry.field?.trim().toLowerCase()
    if (!fieldName || !EMAIL_FIELD_NAMES.has(fieldName)) continue

    const value = getSubmissionValue(submissionData, entry.field)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value
  }

  return undefined
}

function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
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
  const fromForm = getFieldLabelFromForm(form, fieldName)
  const mapped = getEmailFieldLabelMapping(fieldName, fromForm ?? undefined)
  return t(mapped.key, locale, mapped.fallback, payload)
}

function getClientTemplate(
  emailSettings: EmailSetting | null,
  template: NotificationTemplate,
): EmailTemplateConfig | null {
  const group = emailSettings?.clientConfirmation
  if (!group || typeof group !== 'object') return null

  const templateConfig = group[template]
  if (!templateConfig || typeof templateConfig !== 'object') return null

  return templateConfig as EmailTemplateConfig
}

async function resolveTemplateContentHtml(
  payload: Payload,
  templateConfig: EmailTemplateConfig | null,
  fallbackIntro: string,
): Promise<string | undefined> {
  if (templateConfig?.content) {
    const html = await lexicalToEmailHtml(payload, templateConfig.content)
    if (html.trim()) return html
  }

  if (fallbackIntro.trim()) {
    return `<p>${fallbackIntro
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')}</p>`
  }

  return undefined
}

async function sendNotificationEmail({
  payload,
  locale,
  template,
  fields,
  propertyReference,
  subjectSuffix,
  clientEmail,
}: SendNotificationEmailArgs): Promise<void> {
  const settings = await getEmailSettings()
  if (!isEmailConfigured(settings)) return

  const normalizedLocale = (locale.trim().toLowerCase() || 'en') as Locale
  const defaults = TEMPLATE_DEFAULTS[template]
  const clientDefaults = CLIENT_TEMPLATE_DEFAULTS[template]

  const [emailSettings, logo, theme] = await Promise.all([
    payload
      .findGlobal({
        slug: 'emailSettings',
        depth: 2,
        locale: normalizedLocale,
        fallbackLocale: 'en',
        overrideAccess: true,
      })
      .catch(() => null),
    payload.findGlobal({ slug: 'logo', depth: 1, overrideAccess: true }).catch(() => null),
    payload.findGlobal({ slug: 'theme', depth: 0, overrideAccess: true }).catch(() => null),
  ])

  const clientTemplate = getClientTemplate(emailSettings, template)

  const [refLabel, submittedAtLabel, footerText, siteName] = await Promise.all([
    t('email.notification.refLabel', normalizedLocale, 'Property Ref', payload),
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
  ])

  const templateVariables = {
    reference: propertyReference ?? '',
  }

  const teamSubject = applyTemplateVariables(defaults.subject, templateVariables)
  const teamName = defaults.name
  const teamContentHtml = await resolveTemplateContentHtml(payload, null, defaults.intro)

  const formattedPropertyReference = propertyReference
    ? await formatPropertyReferenceForEmail(payload, normalizedLocale, propertyReference)
    : undefined

  const notificationHtml = buildNotificationEmailHtml({
    name: teamName,
    contentHtml: teamContentHtml,
    fields,
    propertyReference: formattedPropertyReference,
    refLabel,
    submittedAtLabel,
    submittedAt: formatSubmittedAt(normalizedLocale),
    footer: footerText,
    logo,
    siteName,
    theme: theme?.colors,
  })

  const sender = settings.sender!
  const recipient = settings.notifications!.recipientAddress!
  const emailSubject = subjectSuffix ? `${teamSubject} — ${subjectSuffix}` : teamSubject

  await sendConfiguredEmail(payload, {
    to: recipient,
    subject: emailSubject,
    html: notificationHtml,
    from: `${sender.fromName} <${sender.fromAddress}>`,
  })

  const clientConfirmation = emailSettings?.clientConfirmation
  if (!clientConfirmation?.enabled || !clientEmail) return

  const clientSubject = applyTemplateVariables(
    clientTemplate?.subject?.trim() || clientDefaults.subject,
    templateVariables,
  )
  const clientContentHtml = applyTemplateVariables(
    (await resolveTemplateContentHtml(payload, clientTemplate, '')) ?? '',
    templateVariables,
  )

  const confirmationHtml = buildClientConfirmationEmailHtml({
    contentHtml: clientContentHtml || undefined,
    logo,
    theme: theme?.colors,
  })

  await sendConfiguredEmail(payload, {
    to: clientEmail,
    subject: clientSubject,
    html: confirmationHtml,
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

  const languageField = {
    label: await resolveFieldLabel(payload, 'submissionLocale', formDefinition, locale),
    value: locale,
  }

  if (!fields.some((field) => field.label === languageField.label)) {
    fields.push(languageField)
  }

  const propertyReference = isPropertyInquiry
    ? getSubmissionValue(submissionData, 'reference')
    : undefined

  await sendNotificationEmail({
    payload,
    locale,
    template,
    fields,
    propertyReference,
    subjectSuffix: formTitle,
    clientEmail: getClientEmail(submissionData),
  })
}
