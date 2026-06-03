'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect, useRef, useState } from 'react'

import RichText from '@/components/RichText'
import { fields as defaultFields } from '@/blocks/Form/fields'
import { useFormSubmission } from '@/blocks/Form/useFormSubmission'

import { contactFields } from './contactFields'

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
}

declare global {
  interface Window {
    grecaptcha?: any
  }
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
}) => {
  const {
    id: formID,
    title: formTitle,
    confirmationMessage,
    confirmationType,
    submitButtonLabel,
    fields: formFields,
  } = formFromProps

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  const recaptchaConfigured = Boolean(recaptchaSiteKey)
  const [hasMounted, setHasMounted] = useState(false)
  const recaptchaEnabled = hasMounted && recaptchaConfigured
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false)
  const [recaptchaLoadError, setRecaptchaLoadError] = useState<string | null>(null)
  const [recaptchaValidationError, setRecaptchaValidationError] = useState<string | null>(null)
  const [recaptchaMountKey, setRecaptchaMountKey] = useState(0)
  const widgetIdRef = useRef<number | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null)

  const clearRecaptchaWidget = () => {
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = ''
    }
    widgetIdRef.current = null
    setIsRecaptchaReady(false)
  }

  const formMethods = useForm<any>({
    defaultValues: formFields as any,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const { isLoading, hasSubmitted, error, onSubmit, resetSubmission } = useFormSubmission(
    formFromProps,
    {
      syncToOptimaCrm: true,
      recaptchaRequired: recaptchaConfigured,
      recaptchaToken,
    },
  )

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasSubmitted) {
      formMethods.reset({})
      setRecaptchaToken('')
      setRecaptchaLoadError(null)
      setRecaptchaValidationError(null)
      clearRecaptchaWidget()
    }
  }, [hasSubmitted, formMethods])

  useEffect(() => {
    if (!recaptchaEnabled || hasSubmitted) return

    const renderWidget = () => {
      const container = recaptchaContainerRef.current
      if (!container) return
      if (!window.grecaptcha) return
      if (widgetIdRef.current !== null) return

      container.innerHTML = ''
      const standardRender =
        typeof window.grecaptcha?.render === 'function' ? window.grecaptcha.render : undefined
      const enterpriseRender =
        typeof window.grecaptcha?.enterprise?.render === 'function'
          ? window.grecaptcha.enterprise.render
          : undefined
      const renderFn = standardRender || enterpriseRender

      if (!renderFn) {
        setRecaptchaLoadError(
          'reCAPTCHA key or script is incompatible with checkbox mode. Please use a v2 checkbox site key.',
        )
        return
      }

      widgetIdRef.current = renderFn(container, {
        sitekey: recaptchaSiteKey,
        callback: (token: string) => {
          setRecaptchaToken(token)
          setRecaptchaValidationError(null)
        },
        'expired-callback': () => {
          setRecaptchaToken('')
        },
        'error-callback': () => {
          setRecaptchaToken('')
        },
      })

      setIsRecaptchaReady(true)
      setRecaptchaLoadError(null)
    }

    const scriptId = 'recaptcha-api'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    const runWhenReady = () => {
      const standardReady =
        typeof window.grecaptcha?.ready === 'function' ? window.grecaptcha.ready : undefined
      const enterpriseReady =
        typeof window.grecaptcha?.enterprise?.ready === 'function'
          ? window.grecaptcha.enterprise.ready
          : undefined
      const readyFn = standardReady || enterpriseReady

      if (readyFn) {
        readyFn(() => renderWidget())
        return
      }

      renderWidget()
    }

    if (window.grecaptcha) {
      runWhenReady()
      return
    }

    const onScriptLoad = () => {
      runWhenReady()
    }

    if (existingScript) {
      existingScript.addEventListener('load', onScriptLoad)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.defer = true
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.addEventListener('load', onScriptLoad)
    document.body.appendChild(script)

    return () => {
      clearRecaptchaWidget()
    }
  }, [recaptchaEnabled, recaptchaSiteKey, hasSubmitted, recaptchaMountKey])

  const resetSubmissionWithRecaptcha = () => {
    setRecaptchaToken('')
    setRecaptchaValidationError(null)
    clearRecaptchaWidget()
    setRecaptchaMountKey((key) => key + 1)
    resetSubmission()
  }

  const handleContactSubmit = (data: any) => {
    if (recaptchaConfigured && !recaptchaToken) {
      setRecaptchaValidationError('This field is required')
      return
    }

    setRecaptchaValidationError(null)
    onSubmit(data)
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
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                check
              </span>
            </div>

            {(successTitle || successSubtitle) && (
              <div className="mx-auto max-w-md">
                {successTitle && (
                  <h3 className="font-headline-md text-headline-md text-primary">{successTitle}</h3>
                )}
                {successSubtitle && (
                  <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                    {successSubtitle}
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
                    className="inline-flex items-center gap-2 rounded-full border border-tertiary/50 px-8 py-3 font-label-nav text-label-nav uppercase tracking-[0.14em] text-tertiary transition hover:bg-tertiary hover:text-white"
                    type="button"
                    onClick={resetSubmissionWithRecaptcha}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_circle_right
                    </span>
                    {resubmitButtonLabel || 'Submit another response'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isLoading && !hasSubmitted && (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading, please wait...</p>
      )}
      {!hasSubmitted && (
        <form className="space-y-5" id={String(formID)} onSubmit={handleSubmit(handleContactSubmit)}>
          {eyebrow && (
            <p className="font-label-nav text-label-nav uppercase tracking-[0.2em] text-tertiary">
              {eyebrow}
            </p>
          )}
          {(heading || formTitle) && (
            <h3 className="font-headline-md text-headline-md text-primary">
              {heading || formTitle}
            </h3>
          )}

          {(description || heading || formTitle) && (
            <div className="h-px w-full bg-outline-variant/60" />
          )}

          {description && (
            <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
          )}

          {error && (
            <div
              className="rounded-xl border border-error/30 bg-error/5 px-4 py-3"
              role="alert"
            >
              <p className="flex items-start gap-2 font-body-md text-body-md text-error">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px]">error</span>
                <span>{error.message}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {formFields?.map((field, index) => {
              const blockType = field.blockType as string
              const ContactField: React.FC<any> | undefined = (contactFields as any)[blockType]
              const isWideField =
                blockType === 'textarea' ||
                blockType === 'message' ||
                blockType === 'country' ||
                blockType === 'checkbox'

              if (ContactField) {
                return (
                  <div className={isWideField ? 'md:col-span-2' : ''} key={index}>
                    <ContactField
                      {...field}
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
                  <div className={isWideField ? 'md:col-span-2' : ''} key={index}>
                    <DefaultField
                      form={formFromProps}
                      {...field}
                      control={control}
                      errors={errors}
                      register={register}
                    />
                  </div>
                )
              }

              return null
            })}
          </div>

          {recaptchaEnabled && (
            <div className="space-y-2">
              <div key={`recaptcha-${recaptchaMountKey}`} ref={recaptchaContainerRef} />
              {recaptchaLoadError && (
                <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
              )}
              {isRecaptchaReady && !recaptchaToken && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Please verify you are not a robot.
                </p>
              )}
              {recaptchaValidationError && <p className="mt-2 text-red-500 text-sm">{recaptchaValidationError}</p>}
            </div>
          )}

          <button
            disabled={isLoading}
            className={`w-full rounded-xl bg-tertiary px-8 py-4 font-label-nav text-label-nav cursor-pointer text-white transition active:scale-95 hover:opacity-90 ${
              isLoading ? 'cursor-not-allowed opacity-70' : ''
            }`}
            form={String(formID)}
            type="submit"
          >
            {submitLabelOverride || submitButtonLabel}
          </button>

          {trustNote && (
            <p className="flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              {trustNote}
            </p>
          )}
        </form>
      )}
    </FormProvider>
  )
}
