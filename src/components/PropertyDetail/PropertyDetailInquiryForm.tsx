'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import React, { useMemo } from 'react'

import { ContactForm } from '@/blocks/ContactSectionBlock/ContactForm'
import type { Form } from '@/payload-types'
import {
  buildPropertyInquiryHiddenFields,
  type PropertyInquiryContext,
} from '@/utilities/propertyInquiry'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  propertyTitle: string
}

const DEFAULT_MESSAGE =
  "Hello, I'm interested in this property and would like to visit it.\nThank you."

function resolveMessageFieldName(form: Form): string | undefined {
  for (const field of form.fields ?? []) {
    if (
      field &&
      typeof field === 'object' &&
      'blockType' in field &&
      field.blockType === 'textarea' &&
      'name' in field &&
      typeof field.name === 'string'
    ) {
      return field.name
    }
  }

  return undefined
}

export const PropertyDetailInquiryForm: React.FC<Props> = ({
  contactForm,
  inquiry,
  propertyTitle,
}) => {
  const hiddenFields = useMemo(() => {
    const entries = buildPropertyInquiryHiddenFields(inquiry)
    return Object.fromEntries(entries.map(({ field, value }) => [field, value]))
  }, [inquiry])

  const defaultFieldValues = useMemo(() => {
    if (!contactForm) return undefined

    const messageFieldName = resolveMessageFieldName(contactForm)
    if (!messageFieldName) return undefined

    return { [messageFieldName]: DEFAULT_MESSAGE }
  }, [contactForm])

  if (!contactForm) {
    return (
      <div className="sticky top-32 bg-white p-8 rounded-xl shadow-2xl border border-outline-variant/20">
        <p className="text-body-md text-on-surface-variant">
          Contact form is not configured. Add a form titled &quot;Contact Form&quot; in the admin
          panel.
        </p>
      </div>
    )
  }

  return (
    <div
      className="sticky top-32 bg-white p-6 rounded-xl shadow-2xl border border-outline-variant/20"
      id="property-inquiry-form"
    >
      <ContactForm
        defaultFieldValues={defaultFieldValues}
        enableResubmit
        form={contactForm as unknown as FormType}
        heading="Contact Us"
        hiddenFields={hiddenFields}
        resubmitButtonLabel="Send another inquiry"
        singleColumn
        submitLabelOverride="Submit Request"
        successSubtitle={`Our team will contact you shortly about ${propertyTitle}.`}
        successTitle="Request Received"
        trustNote="By clicking submit, you agree to our privacy policy and terms."
      />
    </div>
  )
}
