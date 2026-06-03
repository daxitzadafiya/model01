'use client'

import type { Form as FormType, FormFieldBlock } from '@payloadcms/plugin-form-builder/types'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { getClientSideURL } from '@/utilities/getURL'
import { parseFormSubmissionError } from '@/utilities/parseFormSubmissionError'

type FormSubmissionState = {
  isLoading: boolean
  hasSubmitted: boolean | undefined
  error: { message: string; status?: string } | undefined
  onSubmit: (data: FormFieldBlock[]) => void
  resetSubmission: () => void
}

type UseFormSubmissionOptions = {
  /**
   * When enabled, we send reCAPTCHA data along with the submission and the
   * server will verify it (see `src/plugins/index.ts`).
   */
  recaptchaRequired?: boolean
  recaptchaToken?: string
  /** Contact section: forward submission to Optima CRM (see `src/plugins/index.ts`). */
  syncToOptimaCrm?: boolean
}

export function useFormSubmission(
  form: FormType | undefined,
  options: UseFormSubmissionOptions = {},
): FormSubmissionState {
  const {
    id: formID,
    confirmationType,
    redirect,
  } = form ?? {}

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      if (!formID) return

      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data as unknown as Record<string, unknown>).map(
          ([name, value]) => ({
          field: name,
          value,
          }),
        )

        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
              ...(options.syncToOptimaCrm ? { syncToOptimaCrm: true } : {}),
              ...(options.recaptchaRequired
                ? {
                    recaptchaRequired: true,
                    recaptchaToken: options.recaptchaToken || '',
                  }
                : {}),
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)
            setError({
              message: parseFormSubmissionError(res),
              status: String(req.status),
            })
            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const redirectUrl = redirect.url
            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [
      router,
      formID,
      redirect,
      confirmationType,
      options.recaptchaRequired,
      options.recaptchaToken,
      options.syncToOptimaCrm,
    ],
  )

  const resetSubmission = useCallback(() => {
    setHasSubmitted(false)
    setError(undefined)
    setIsLoading(false)
  }, [])

  return { isLoading, hasSubmitted, error, onSubmit, resetSubmission }
}

