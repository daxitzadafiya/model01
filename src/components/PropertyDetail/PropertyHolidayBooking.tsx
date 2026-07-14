'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, Check, Lock, Loader2, Users } from 'lucide-react'

import { PropertyHolidayCalendar } from '@/components/PropertyDetail/PropertyHolidayCalendar'
import { GUEST_OPTIONS } from '@/components/PropertyList/filterOptions'
import { FilterSelect } from '@/components/FilterSelect'
import { RecaptchaWidget } from '@/components/RecaptchaWidget/RecaptchaWidget'
import { Checkbox as CheckboxUi } from '@/components/ui/checkbox'
import { CMSLink } from '@/components/Link'
import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import { parseHolidayGuestCount } from '@/utilities/crmHoliday'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import {
  calculateHolidayRentalQuote,
  formatEuro,
  formatHolidayStayNightlyRate,
  formatHolidayStayTotalSummary,
  isRangeAvailable,
  getBlockedDateKeys,
  parseDateOnly,
  parseRentalSeasons,
  type CRMPropertyBooking,
} from '@/utilities/holidayRentalPricing'
import {
  useFormFieldInvalidEmailMessage,
  useFormFieldRequiredMessage,
  useTranslation,
} from '@/utilities/translateClient'

const EMAIL_PATTERN = /^\S[^\s@]*@\S+$/
const PRIVACY_POLICY_VALIDATION_KEY = 'form.validation.privacyPolicy.required'
const PRIVACY_POLICY_VALIDATION_FALLBACK = 'You must accept the Privacy Policy to continue.'

type Props = {
  propertyReference: string
  rentalSeasons: ReturnType<typeof parseRentalSeasons>
  bookings?: CRMPropertyBooking[]
  arrival: string
  departure: string
  guests: string
  onArrivalChange: (value: string) => void
  onDepartureChange: (value: string) => void
  onGuestsChange: (value: string) => void
}

type BookingFormState = {
  forename: string
  surname: string
  email: string
  mobile: string
  message: string
}

type BookingFieldErrors = {
  dates?: string
  forename?: string
  email?: string
  mobile?: string
  terms?: string
}

const defaultFormState = (): BookingFormState => ({
  forename: '',
  surname: '',
  email: '',
  mobile: '',
  message: '',
})

const formatDisplayDate = (value: string) => {
  const date = parseDateOnly(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function renderTermsCheckboxLabel(label: string, privacyPolicyLabel: string) {
  if (!privacyPolicyLabel) return label

  const escaped = privacyPolicyLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = label.split(new RegExp(`(${escaped})`, 'i'))

  return parts.map((part, index) =>
    new RegExp(`^${escaped}$`, 'i').test(part) ? (
      <CMSLink
        key={index}
        appearance="inline"
        className="font-medium text-tertiary decoration-tertiary/40 underline-offset-2 cursor-pointer hover:text-tertiary/80"
        label={privacyPolicyLabel}
        newTab={true}
        type="custom"
        url="/privacy"
      />
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  )
}

export const PropertyHolidayBooking: React.FC<Props> = ({
  propertyReference,
  rentalSeasons,
  bookings = [],
  arrival,
  departure,
  guests,
  onArrivalChange,
  onDepartureChange,
  onGuestsChange,
}) => {
  const heading = useTranslation('propertyDetail.holiday.heading', 'Book Your Stay')
  const selectDatesTitle = useTranslation('propertyDetail.holiday.selectDatesTitle', 'Select dates')
  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const firstNameLabel = useTranslation('propertyDetail.holiday.firstName', 'First Name')
  const lastNameLabel = useTranslation('propertyDetail.holiday.lastName', 'Last Name')
  const emailLabel = useTranslation('propertyDetail.holiday.email', 'Email')
  const phoneLabel = useTranslation('propertyDetail.holiday.phone', 'Phone Number')
  const messageLabel = useTranslation('propertyDetail.holiday.message', 'Message')
  const submitLabel = useTranslation('propertyDetail.holiday.submit', 'Enquire / Book')
  const submittingLabel = useTranslation('propertyDetail.holiday.submitting', 'Sending enquiry…')
  const successTitle = useTranslation('propertyDetail.holiday.successTitle', 'Enquiry Sent')
  const successSubtitle = useTranslation(
    'propertyDetail.holiday.successSubtitle',
    'Our team will confirm availability and contact you shortly.',
  )
  const nightsLabel = useTranslation('propertyDetail.holiday.nights', 'nights')
  const selectDatesHint = useTranslation(
    'propertyDetail.holiday.selectDatesHint',
    'Select arrival and departure dates to see the rental price.',
  )
  const datesRequiredMessage = useTranslation(
    'propertyDetail.holiday.datesRequired',
    'Select dates is required',
  )
  const unavailableHint = useTranslation(
    'propertyDetail.holiday.unavailableHint',
    'Selected dates are not available. Please choose different dates.',
  )
  const minimumStayHint = useTranslation(
    'propertyDetail.holiday.minimumStayHint',
    'Minimum stay for this period is',
  )
  const trustNote = useTranslation(
    'propertyDetail.inquiry.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )
  const requiredError = useTranslation(
    'propertyDetail.holiday.requiredError',
    'Please complete all required fields and select valid dates.',
  )
  const termsLabel = useTranslation(
    'propertyDetail.holiday.termsLabel',
    'I confirm that I have reviewed and accepted the Privacy Policy.',
  )
  const privacyPolicyLabel = useTranslation(
    'propertyDetail.holiday.privacyPolicyLink',
    'Privacy Policy',
  )
  const submitErrorLabel = useTranslation(
    'propertyDetail.holiday.submitError',
    'Could not send your enquiry. Please try again.',
  )
  const checkInLabel = useTranslation('propertyDetail.holiday.checkIn', 'Check-in')
  const checkOutLabel = useTranslation('propertyDetail.holiday.checkOut', 'Check-out')
  const yourDetailsLabel = useTranslation('propertyDetail.holiday.yourDetails', 'Your details')
  const forenameRequiredMessage = useFormFieldRequiredMessage('forename', firstNameLabel)
  const emailRequiredMessage = useFormFieldRequiredMessage('email', emailLabel)
  const emailInvalidMessage = useFormFieldInvalidEmailMessage('email')
  const mobileRequiredMessage = useFormFieldRequiredMessage('phone', phoneLabel)
  const termsAcceptanceError = useTranslation(
    PRIVACY_POLICY_VALIDATION_KEY,
    PRIVACY_POLICY_VALIDATION_FALLBACK,
  )

  const guestOptions = useMemo(() => GUEST_OPTIONS.filter((option) => option.value !== 'any'), [])

  const resolvedGuests = guests && guests !== 'any' ? guests : '2'

  const [form, setForm] = useState<BookingFormState>(() => defaultFormState())
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const { settings: integrations } = useIntegrationsSettings()
  const recaptchaSiteKey = integrations.recaptchaSiteKey
  const recaptchaConfigured = Boolean(recaptchaSiteKey)
  const locale = useSiteLocale()

  const recaptchaRequiredMessage = useTranslation(
    'form.validation.recaptcha.hint',
    'Please verify you are not a robot.',
  )
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaLoadError, setRecaptchaLoadError] = useState<string | null>(null)
  const [recaptchaValidationError, setRecaptchaValidationError] = useState<string | null>(null)
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0)

  const blocked = useMemo(() => getBlockedDateKeys(bookings), [bookings])

  const quote = useMemo(() => {
    if (!arrival || !departure) return null
    return calculateHolidayRentalQuote({
      seasons: rentalSeasons,
      checkIn: arrival,
      checkOut: departure,
      guests: parseHolidayGuestCount(resolvedGuests),
    })
  }, [arrival, departure, resolvedGuests, rentalSeasons])

  const datesAvailable = arrival && departure ? isRangeAvailable(blocked, arrival, departure) : true

  const meetsMinimumStay =
    !quote?.minimumPeriod || !quote?.nights || quote.nights >= quote.minimumPeriod

  const clearFieldError = (key: keyof BookingFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleFieldChange = (key: keyof BookingFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
    if (key === 'forename' || key === 'email' || key === 'mobile') {
      clearFieldError(key)
    }
  }

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked)
    if (checked) clearFieldError('terms')
  }

  const handleArrivalChange = (value: string) => {
    onArrivalChange(value)
    clearFieldError('dates')
    setError(null)
  }

  const handleDepartureChange = (value: string) => {
    onDepartureChange(value)
    clearFieldError('dates')
    setError(null)
  }

  const validateDetails = (): boolean => {
    const next: BookingFieldErrors = {}

    if (!arrival || !departure) {
      next.dates = datesRequiredMessage
    }

    if (!form.forename.trim()) {
      next.forename = forenameRequiredMessage
    }

    const emailValue = form.email.trim()
    if (!emailValue) {
      next.email = emailRequiredMessage
    } else if (!EMAIL_PATTERN.test(emailValue)) {
      next.email = emailInvalidMessage
    }

    if (!form.mobile.trim()) {
      next.mobile = mobileRequiredMessage
    }

    if (!termsAccepted) {
      next.terms = termsAcceptanceError
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRecaptchaValidationError(null)
    setError(null)

    const detailsValid = validateDetails()
    const recaptchaMissing = recaptchaConfigured && !recaptchaToken

    if (recaptchaMissing) {
      setRecaptchaValidationError(recaptchaRequiredMessage)
    }

    if (!detailsValid || recaptchaMissing) {
      return
    }

    if (!propertyReference || !quote || !datesAvailable || !meetsMinimumStay) {
      setError(requiredError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/crm/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_reference: propertyReference,
          forename: form.forename.trim(),
          surname: form.surname.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          guests: parseHolidayGuestCount(resolvedGuests),
          message: form.message.trim(),
          arrival,
          departure,
          recaptchaToken,
          terms_accepted: termsAccepted,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? `Booking failed (${response.status})`)
      }

      setSubmitted(true)
    } catch (submitError) {
      console.error('Holiday booking enquiry failed', submitError)
      const message = submitError instanceof Error ? submitError.message : submitErrorLabel
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-lg:static max-lg:top-auto rounded-xl border border-outline-variant/20 bg-white p-4 shadow-2xl sm:p-6 lg:sticky lg:top-32">
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-white px-6 py-10 md:px-8 md:py-12">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-tertiary/5 to-transparent" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full border-22 border-tertiary/10" />
          <div className="pointer-events-none absolute -left-16 -bottom-14 h-36 w-56 rounded-[100%] border border-tertiary/10" />

          <div className="relative z-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary text-white shadow-sm">
              <Check size={30} strokeWidth={2.5} />
            </div>
            {successTitle && (
              <h3 className="font-headline-md text-headline-md text-primary">{successTitle}</h3>
            )}
            {successSubtitle && (
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                {successSubtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-lg:static max-lg:top-auto space-y-4 rounded-xl border border-outline-variant/20 bg-white p-4 shadow-2xl sm:p-6 lg:sticky lg:top-32"
      id="property-holiday-booking"
    >
      <h2 className="font-headline-md text-headline-md text-primary">{heading}</h2>

      <div>
        <h3 className="mb-3 font-headline-sm text-headline-sm text-primary">{selectDatesTitle}</h3>
        <PropertyHolidayCalendar
          bookings={bookings}
          arrival={arrival}
          departure={departure}
          onArrivalChange={handleArrivalChange}
          onDepartureChange={handleDepartureChange}
          compact
          showTitle={false}
          showLegend
          legendVariant="availability"
        />
        {fieldErrors.dates && <div className="mt-2 text-red-500 text-sm">{fieldErrors.dates}</div>}
      </div>

      {(arrival || departure) && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-outline-variant/25 bg-outline-variant/25">
          <div className="bg-white px-3 py-2.5">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
              {checkInLabel}
            </p>
            <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
              <CalendarDays size={15} className="shrink-0 text-tertiary" strokeWidth={2} />
              {arrival ? formatDisplayDate(arrival) : '—'}
            </p>
          </div>
          <div className="bg-white px-3 py-2.5">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
              {checkOutLabel}
            </p>
            <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
              <CalendarDays size={15} className="shrink-0 text-tertiary" strokeWidth={2} />
              {departure ? formatDisplayDate(departure) : '—'}
            </p>
          </div>
        </div>
      )}

      <FilterSelect
        label={guestsLabel}
        id="holiday-booking-guests"
        icon={<Users size={20} strokeWidth={1.75} />}
        options={guestOptions}
        value={resolvedGuests}
        onChange={onGuestsChange}
        className="w-full"
      />

      <div
        className={`rounded-xl p-4 transition-colors ${
          quote ? 'border border-tertiary/25 bg-tertiary/5' : 'bg-surface-container-low'
        }`}
      >
        {quote ? (
          <div className="space-y-1">
            <p className="text-[22px] font-semibold leading-tight text-tertiary">
              {formatHolidayStayNightlyRate(quote)}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {quote.nights} {nightsLabel} · {formatHolidayStayTotalSummary(quote)}
            </p>
            <p className="text-label-sm text-on-surface-variant/80">
              Total rental: {formatEuro(quote.totalPrice)}
            </p>
            {!datesAvailable && <p className="pt-1 text-body-sm text-red-600">{unavailableHint}</p>}
            {!meetsMinimumStay && quote.minimumPeriod && (
              <p className="pt-1 text-body-sm text-red-600">
                {minimumStayHint} {quote.minimumPeriod} {nightsLabel}.
              </p>
            )}
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant">{selectDatesHint}</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border-t border-outline-variant/15 pt-4"
        noValidate
      >
        <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
          {yourDetailsLabel}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
              {firstNameLabel} *
            </span>
            <input
              type="text"
              value={form.forename}
              onChange={(event) => handleFieldChange('forename', event.target.value)}
              placeholder={firstNameLabel}
              className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-tertiary focus:ring-0"
            />
            {fieldErrors.forename && (
              <div className="mt-2 text-red-500 text-sm">{fieldErrors.forename}</div>
            )}
          </label>
          <label className="block">
            <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
              {lastNameLabel}
            </span>
            <input
              type="text"
              value={form.surname}
              onChange={(event) => handleFieldChange('surname', event.target.value)}
              placeholder={lastNameLabel}
              className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-tertiary focus:ring-0"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {emailLabel} *
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            placeholder={emailLabel}
            className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-tertiary focus:ring-0"
          />
          {fieldErrors.email && (
            <div className="mt-2 text-red-500 text-sm">{fieldErrors.email}</div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {phoneLabel} *
          </span>
          <input
            type="tel"
            value={form.mobile}
            onChange={(event) => handleFieldChange('mobile', event.target.value)}
            placeholder={phoneLabel}
            className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-tertiary focus:ring-0"
          />
          {fieldErrors.mobile && (
            <div className="mt-2 text-red-500 text-sm">{fieldErrors.mobile}</div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {messageLabel}
          </span>
          <textarea
            rows={3}
            value={form.message}
            onChange={(event) => handleFieldChange('message', event.target.value)}
            placeholder={messageLabel}
            className="w-full resize-y rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-tertiary focus:ring-0"
          />
        </label>

        <div className="pt-2">
          <label
            className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3.5 border-outline-variant/35"
            htmlFor="holiday-terms-checkbox"
          >
            <CheckboxUi
              id="holiday-terms-checkbox"
              checked={termsAccepted}
              onCheckedChange={(checked) => handleTermsChange(checked === true)}
              aria-label={termsLabel}
            />
            <span className="text-body-sm text-on-surface leading-relaxed">
              <span className="mr-1 text-tertiary">*</span>
              {renderTermsCheckboxLabel(termsLabel, privacyPolicyLabel)}
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="mt-2 flex items-start gap-1.5 text-red-500 text-sm">
              <AlertCircle className="shrink-0" size={16} strokeWidth={2} />
              <span>{fieldErrors.terms}</span>
            </p>
          )}
        </div>

        {recaptchaConfigured && (
          <div className={`mt-3 w-full max-w-full space-y-2 ${submitting ? 'pointer-events-none opacity-60' : ''}`}>
            <RecaptchaWidget
              key={`${locale}-${recaptchaResetKey}`}
              locale={locale}
              siteKey={recaptchaSiteKey}
              onError={setRecaptchaLoadError}
              onTokenChange={(token) => {
                setRecaptchaToken(token)
                if (token) setRecaptchaValidationError(null)
              }}
            />
            {recaptchaLoadError && (
              <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
            )}
            {recaptchaValidationError && (
              <p className="mt-2 text-red-500 text-sm">{recaptchaValidationError}</p>
            )}
          </div>
        )}

        {error && <p className="text-body-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-8 py-4 font-label-nav text-label-nav text-white transition ${
            submitting
              ? 'cursor-not-allowed opacity-80'
              : 'cursor-pointer active:scale-95 hover:opacity-90'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} strokeWidth={2} />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>

        {trustNote && (
          <p className="flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant">
            <Lock size={16} strokeWidth={2} />
            {trustNote}
          </p>
        )}
      </form>
    </div>
  )
}
