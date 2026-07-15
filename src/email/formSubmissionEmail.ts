import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { EmailSetting, Form, FormSubmission } from '@/payload-types'
import type { Locale } from '@/i18n/locales'
import type { Payload } from 'payload'

import { buildClientConfirmationEmailHtml } from '@/email/buildClientConfirmationEmailHtml'
import { buildNotificationEmailHtml } from '@/email/buildNotificationEmailHtml'
import { lexicalToEmailHtml } from '@/email/lexicalToEmailHtml'
import { loadNotificationEmailBranding } from '@/email/loadNotificationEmailBranding'
import { getEmailSettings, isEmailConfigured } from '@/settings/email/server'
import { sendConfiguredEmail } from '@/email/sendConfiguredEmail'
import { getEmailFieldLabelMapping } from '@/utilities/formFieldLabels'
import {
  COMMERCIAL_PROFILE_TYPE_ONE_FIELD,
  COMMERCIAL_PROFILE_TYPE_TWO_FIELD,
} from '@/utilities/propertyInquiry'
import { HOLIDAY_CHECK_IN_HOUR, HOLIDAY_CHECK_OUT_HOUR } from '@/utilities/holidayStayTimes'
import { t } from '@/utilities/translate'

type SubmissionField = {
  field: string
  value: string | boolean | number | null | undefined
}

type NotificationTemplate = 'contact' | 'propertyInquiry' | 'holidayBooking'

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
  templateVariables?: Record<string, string>
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
  COMMERCIAL_PROFILE_TYPE_ONE_FIELD,
  COMMERCIAL_PROFILE_TYPE_TWO_FIELD,
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
  holidayBooking: {
    subject: 'New Holiday Booking Enquiry',
    name: 'New Holiday Booking Enquiry',
    intro: 'A new holiday rental booking enquiry has been received from your website.',
  },
}

const CLIENT_TEMPLATE_DEFAULTS: Record<NotificationTemplate, { subject: string }> = {
  contact: {
    subject: 'Thank you for your enquiry',
  },
  propertyInquiry: {
    subject: 'Enquiry about property (Ref: {{reference}})',
  },
  holidayBooking: {
    subject: 'Holiday booking enquiry (Ref: {{reference}})',
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
    getSubmissionValue(submissionData, 'property') ||
    getSubmissionValue(submissionData, 'reference'),
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
  templateVariables: extraTemplateVariables,
}: SendNotificationEmailArgs): Promise<void> {
  const settings = await getEmailSettings()
  if (!isEmailConfigured(settings)) return

  const normalizedLocale = (locale.trim().toLowerCase() || 'en') as Locale
  const defaults = TEMPLATE_DEFAULTS[template]
  const clientDefaults = CLIENT_TEMPLATE_DEFAULTS[template]

  const [emailSettings, branding] = await Promise.all([
    payload
      .findGlobal({
        slug: 'emailSettings',
        depth: 2,
        locale: normalizedLocale,
        fallbackLocale: 'en',
        overrideAccess: true,
      })
      .catch(() => null),
    loadNotificationEmailBranding(payload),
  ])

  const { logo, logoSrc, theme } = branding

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
    t('email.notification.siteName', normalizedLocale, branding.siteName, payload),
  ])

  const templateVariables = {
    reference: propertyReference ?? '',
    ...extraTemplateVariables,
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
    logoSrc,
    siteName,
    theme,
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
    logoSrc,
    theme,
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
    label: await resolveFieldLabel(payload, 'language', formDefinition, locale),
    value: locale,
  }

  if (!fields.some((field) => field.label === languageField.label)) {
    fields.push(languageField)
  }

  if (isPropertyInquiry) {
    const transactionType = getSubmissionValue(submissionData, 'transaction_types')
    const enquiryType = resolveEnquiryTypeLabel(transactionType || 'Buy')
    fields.push({
      label: await resolveFieldLabel(payload, 'enquiry_type', formDefinition, locale),
      value: enquiryType,
    })
  }

  const propertyReference = isPropertyInquiry
    ? getSubmissionValue(submissionData, 'property')
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

export type HolidayBookingEmailInput = {
  property_reference: string
  forename: string
  email: string
  mobile: string
  arrival: string
  departure: string
  surname?: string
  guests?: number
  message?: string
  locale?: string
  /** Total rental quote amount for the selected stay (optional). */
  price?: number | string
}

/** Maps CRM / form transaction types to the enquiry-type label shown in emails. */
export function resolveEnquiryTypeLabel(transactionType?: string): string {
  const normalized = transactionType?.trim().toLowerCase() ?? ''
  if (normalized === 'buy' || normalized === 'sale') return 'Sale Property'
  if (
    normalized === 'short term rental' ||
    normalized === 'short-term rental' ||
    normalized === 'holiday' ||
    normalized === 'holiday rental'
  ) {
    return 'Holiday Property'
  }
  if (
    normalized === 'long term rental' ||
    normalized === 'long-term rental' ||
    normalized === 'rent'
  ) {
    return 'Long Term Property'
  }
  return transactionType?.trim() || 'Holiday Property'
}

function padTimeHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function formatHolidayDateTimeForEmail(value: string, hour: number): string {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value.trim()
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (!Number.isFinite(date.getTime())) return value.trim()
  const datePart = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${datePart} at ${padTimeHour(hour)}`
}

function formatHolidayPriceForEmail(price?: number | string): string {
  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    return `€${Math.round(price).toLocaleString('en-US')}`
  }
  if (typeof price === 'string') {
    const trimmed = price.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('€')) return trimmed
    const numeric = Number(trimmed.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(numeric) && numeric > 0) {
      return `€${Math.round(numeric).toLocaleString('en-US')}`
    }
    return trimmed
  }
  return ''
}

/** Team notification + client thank-you for holiday rental booking enquiries. */
export async function sendHolidayBookingNotificationEmail({
  payload,
  input,
}: {
  payload: Payload
  input: HolidayBookingEmailInput
}): Promise<void> {
  const locale = input.locale?.trim().toLowerCase() || 'en'
  const propertyReference = input.property_reference.trim()
  const forename = input.forename.trim()
  const surname = input.surname?.trim() ?? ''
  const email = input.email.trim()
  const mobile = input.mobile.trim()
  const arrival = input.arrival.trim()
  const departure = input.departure.trim()
  const message = input.message?.trim() ?? ''
  const guests =
    typeof input.guests === 'number' && Number.isFinite(input.guests) && input.guests > 0
      ? String(Math.floor(input.guests))
      : ''
  const priceDisplay = formatHolidayPriceForEmail(input.price)
  const enquiryType = resolveEnquiryTypeLabel('short term rental')

  const arrivalDisplay = formatHolidayDateTimeForEmail(arrival, HOLIDAY_CHECK_IN_HOUR)
  const departureDisplay = formatHolidayDateTimeForEmail(departure, HOLIDAY_CHECK_OUT_HOUR)

  // Field order matches the ops checklist for holiday booking enquiry emails.
  // Prop. Ref is rendered via the dedicated property-reference callout.
  const rawFields: Array<{ field: string; value: string }> = [
    { field: 'forename', value: forename },
    { field: 'surname', value: surname },
    { field: 'email', value: email },
    { field: 'mobile', value: mobile },
    { field: 'language', value: locale },
    { field: 'enquiry_type', value: enquiryType },
    { field: 'arrival', value: arrivalDisplay },
    { field: 'departure', value: departureDisplay },
    { field: 'guests', value: guests },
    { field: 'message', value: message },
    { field: 'price', value: priceDisplay },
  ]

  const fields = await Promise.all(
    rawFields
      .filter((entry) => Boolean(entry.value))
      .map(async (entry) => ({
        label: await resolveFieldLabel(payload, entry.field, null, locale),
        value: entry.value,
      })),
  )

  await sendNotificationEmail({
    payload,
    locale,
    template: 'holidayBooking',
    fields,
    propertyReference,
    subjectSuffix: 'Holiday rental',
    clientEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    templateVariables: {
      arrival: arrivalDisplay,
      departure: departureDisplay,
      guests,
      price: priceDisplay,
      enquiry_type: enquiryType,
    },
  })
}
