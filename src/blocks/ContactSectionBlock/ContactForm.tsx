'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import { AlertCircle, Check, CircleArrowRight, Loader2, Lock } from 'lucide-react'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'

import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import RichText from '@/components/RichText'
import { RecaptchaWidget } from '@/components/RecaptchaWidget/RecaptchaWidget'
import { fields as defaultFields } from '@/blocks/Form/fields'
import { useFormSubmission } from '@/blocks/Form/useFormSubmission'

import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'
import { useSiteLocale } from '@/utilities/useSiteLocale'

import { contactFields } from './contactFields'
import { formatPhoneE164 } from '@/utilities/phoneValidation'

type HiddenFieldValue = string | boolean

type Props = {
  form: FormType
  eyebrow?: string | null
  heading?: string | null
  description?: string | null
  trustNote?: string | null
  submitLabelOverride?: string | null
  enableResubmit?: boolean | null
  resubmitButtonLabel?: string | null
  successTitle?: string | null
  successSubtitle?: string | null
  successThanks?: string | null
  /** Merged into the submission payload (e.g. property inquiry CRM fields). */
  hiddenFields?: Record<string, HiddenFieldValue>
  /** Overrides default values for visible form fields by field name. */
  defaultFieldValues?: Record<string, string>
  /** Stack all fields in a single column (property detail sidebar). */
  singleColumn?: boolean
}

export const ContactForm: React.FC<Props> = ({
  form: formFromProps,
  eyebrow,
  heading,
  description,
  trustNote,
  submitLabelOverride,
  enableResubmit,
  resubmitButtonLabel,
  successTitle,
  successSubtitle,
  successThanks,
  hiddenFields,
  defaultFieldValues,
  singleColumn = false,
}) => {
  const {
    id: formID,
    title: formTitle,
    confirmationMessage,
    confirmationType,
    submitButtonLabel,
    fields: formFields,
  } = formFromProps

  const { settings: integrations } = useIntegrationsSettings()
  const recaptchaSiteKey = integrations.recaptchaSiteKey
  const recaptchaConfigured = Boolean(recaptchaSiteKey)
  const locale = useSiteLocale()
  const deferredLocale = useDeferredSiteLocale()
  const recaptchaRequiredMessage = useTranslation(
    'form.validation.recaptcha.hint',
    'Please verify you are not a robot.',
  )
  const submittingLabel = useTranslation('form.submit.submitting', 'Submitting…')
  const translatedFormTitle = useTranslation('form.title.contact', formTitle || 'Contact Form')
  const translatedSubmitLabel = useTranslation(
    'form.submit.connectNow',
    submitButtonLabel || 'Connect now',
  )
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaLoadError, setRecaptchaLoadError] = useState<string | null>(null)
  const [recaptchaValidationError, setRecaptchaValidationError] = useState<string | null>(null)
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0)

  const formMethods = useForm<any>({
    defaultValues: formFields as any,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const extraSubmissionFields = hiddenFields
    ? Object.entries(hiddenFields).map(([field, value]) => ({ field, value }))
    : undefined

  const { isLoading, hasSubmitted, error, onSubmit, resetSubmission } = useFormSubmission(
    formFromProps,
    {
      syncToOptimaCrm: true,
      recaptchaRequired: recaptchaConfigured,
      recaptchaToken,
      extraSubmissionFields,
    },
  )

  useEffect(() => {
    if (hasSubmitted) {
      formMethods.reset({})
      setRecaptchaToken('')
      setRecaptchaLoadError(null)
      setRecaptchaValidationError(null)
    }
  }, [hasSubmitted, formMethods])

  const resetSubmissionWithRecaptcha = () => {
    setRecaptchaToken('')
    setRecaptchaValidationError(null)
    setRecaptchaResetKey((key) => key + 1)
    formMethods.reset(defaultFieldValues ?? {})
    resetSubmission()
  }

  const handleContactSubmit = (data: any) => {
    if (isLoading) return

    if (recaptchaConfigured && !recaptchaToken) {
      setRecaptchaValidationError(recaptchaRequiredMessage)
      return
    }

    setRecaptchaValidationError(null)

    const normalizedData = { ...data }
    for (const [key, value] of Object.entries(normalizedData)) {
      if (typeof value === 'string' && /phone|mobile|tel/i.test(key)) {
        normalizedData[key] = formatPhoneE164(value) || value
      }
    }

    onSubmit(normalizedData)
  }

  return (
    <FormProvider {...formMethods}>
      {!isLoading && hasSubmitted && confirmationType === 'message' && (
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-white px-6 py-10 md:px-8 md:py-12">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-tertiary/5 to-transparent" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full border-22 border-tertiary/10" />
          <div className="pointer-events-none absolute -left-16 -bottom-14 h-36 w-56 rounded-[100%] border border-tertiary/10" />

          <div className="relative z-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary text-white shadow-sm">
              <Check size={30} strokeWidth={2.5} />
            </div>

            {(successTitle || successSubtitle || successThanks) && (
              <div className="mx-auto max-w-md">
                {successTitle && (
                  <h3 className="font-headline-md text-headline-md text-primary">{successTitle}</h3>
                )}
                {successSubtitle && (
                  <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                    {successSubtitle}
                  </p>
                )}
                {successThanks && (
                  <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                    {successThanks}
                  </p>
                )}
              </div>
            )}

            {confirmationMessage && (
              <RichText
                className="mx-auto mt-3 max-w-md [&_h1]:font-headline-md [&_h1]:text-headline-md [&_h1]:text-primary [&_h2]:font-headline-md [&_h2]:text-headline-md [&_h2]:text-primary [&_p]:mt-2 [&_p]:font-body-md [&_p]:text-body-md [&_p]:text-on-surface-variant"
                data={confirmationMessage}
                enableGutter={false}
              />
            )}

            {enableResubmit && (
              <>
                <div className="mx-auto mt-6 h-px w-full max-w-md bg-outline-variant/50" />
                <div className="mt-6 flex justify-center">
                  <button
                    className="inline-flex items-center gap-2 rounded-full cursor-pointer border border-tertiary/50 px-8 py-3 font-label-nav text-label-nav uppercase tracking-[0.14em] text-tertiary transition hover:bg-tertiary hover:text-white"
                    type="button"
                    onClick={resetSubmissionWithRecaptcha}
                  >
                    <CircleArrowRight size={16} strokeWidth={2} />
                    {resubmitButtonLabel || 'Submit another response'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!hasSubmitted && (
        <form
          key={locale}
          className="space-y-5"
          id={String(formID)}
          onSubmit={handleSubmit(handleContactSubmit)}
        >
          {eyebrow && (
            <p className="font-label-nav text-label-nav uppercase tracking-[0.2em] text-tertiary">
              {eyebrow}
            </p>
          )}
          {(heading || formTitle) && (
            <h3 className="font-headline-md text-headline-md text-primary text-center">
              {heading || translatedFormTitle}
            </h3>
          )}

          {(description || heading || formTitle) && (
            <div className="h-px w-full bg-outline-variant/60" />
          )}

          {description && (
            <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
          )}

          {error && (
            <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3" role="alert">
              <p className="flex items-start gap-2 font-body-md text-body-md text-error">
                <AlertCircle className="mt-0.5 shrink-0" size={20} strokeWidth={2} />
                <span>{error.message}</span>
              </p>
            </div>
          )}

          <fieldset
            key={locale}
            className={`m-0 min-w-0 border-0 p-0 ${
              singleColumn ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-4 md:grid-cols-2'
            }`}
            disabled={isLoading}
          >
            {formFields?.map((field, index) => {
              const fieldName = 'name' in field ? field.name : undefined
              const fieldDefaultValue =
                fieldName && defaultFieldValues ? defaultFieldValues[fieldName] : undefined
              const resolvedField =
                fieldDefaultValue != null ? { ...field, defaultValue: fieldDefaultValue } : field
              const blockType = resolvedField.blockType as string
              const ContactField: React.FC<any> | undefined = (contactFields as any)[blockType]
              const isWideField =
                blockType === 'textarea' ||
                blockType === 'message' ||
                blockType === 'country' ||
                blockType === 'checkbox'
              const fieldWrapperClass = !singleColumn && isWideField ? 'md:col-span-2' : ''

              if (ContactField) {
                return (
                  <div className={fieldWrapperClass} key={index}>
                    <ContactField
                      {...resolvedField}
                      errors={errors}
                      control={control}
                      register={register}
                    />
                  </div>
                )
              }

              // Fallback for field types without contact styling (select, checkbox, etc.)
              const DefaultField: React.FC<any> | undefined = (defaultFields as any)[blockType]
              if (DefaultField) {
                return (
                  <div className={fieldWrapperClass} key={index}>
                    <DefaultField
                      form={formFromProps}
                      {...resolvedField}
                      control={control}
                      errors={errors}
                      register={register}
                    />
                  </div>
                )
              }

              return null
            })}
          </fieldset>

          {deferredLocale && recaptchaConfigured && !hasSubmitted && (
            <div className={`mt-4 w-full max-w-full space-y-2 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
              <RecaptchaWidget
                key={`${deferredLocale}-${recaptchaResetKey}`}
                locale={deferredLocale}
                onError={setRecaptchaLoadError}
                onTokenChange={(token) => {
                  setRecaptchaToken(token)
                  if (token) setRecaptchaValidationError(null)
                }}
                siteKey={recaptchaSiteKey}
              />
              {recaptchaLoadError && (
                <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
              )}
              {recaptchaValidationError && (
                <p className="mt-2 text-red-500 text-sm">{recaptchaValidationError}</p>
              )}
            </div>
          )}

          <button
            aria-busy={isLoading}
            disabled={isLoading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-8 py-4 font-label-nav text-label-nav text-white transition ${
              isLoading
                ? 'cursor-not-allowed opacity-80'
                : 'cursor-pointer active:scale-95 hover:opacity-90'
            }`}
            form={String(formID)}
            type="submit"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} strokeWidth={2} />}
            {isLoading ? submittingLabel : submitLabelOverride || translatedSubmitLabel}
          </button>

          {trustNote && (
            <p className="flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant">
              <Lock size={16} strokeWidth={2} />
              {trustNote}
            </p>
          )}
        </form>
      )}
    </FormProvider>
  )
}
