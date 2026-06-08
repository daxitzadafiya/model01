'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import React from 'react'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { Media } from '@/components/Media'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'

import { ContactForm } from './ContactForm'

type Props = Extract<Page['layout'][0], { blockType: 'contactSectionBlock' }>

export const ContactSectionBlock: React.FC<Props> = ({
  formEyebrow,
  formTitle,
  formDescription,
  submitLabelOverride,
  formTrustNote,
  enableResubmit,
  resubmitButtonLabel,
  successTitle,
  successSubtitle,
  offices,
  form,
}) => {
  const formData = typeof form === 'object' && form !== null ? (form as unknown as FormType) : null
  const sectionRef = useReveal()

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-surface-container py-20 md:py-24">
      <div className="container mx-auto grid gap-12 px-6 md:gap-16 lg:grid-cols-2 lg:items-start">
        {formData && (
          <div className="reveal rounded-none border-t-2 border-tertiary bg-white px-6 py-8 md:px-10 md:py-12 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.45)]">
            <ContactForm
              description={formDescription}
              eyebrow={formEyebrow}
              form={formData}
              heading={formTitle}
              submitLabelOverride={submitLabelOverride}
              trustNote={formTrustNote}
              enableResubmit={enableResubmit}
              resubmitButtonLabel={resubmitButtonLabel}
              successTitle={successTitle}
              successSubtitle={successSubtitle}
            />
          </div>
        )}

        <div>
          {(offices || []).map((office, i) => (
            <article
              className="reveal mb-5 last:mb-0 rounded-none bg-surface px-6 py-6 md:px-8 md:py-7"
              key={office.id || i}
            >
              <div className="flex items-start justify-between gap-4">
                {office.label && (
                  <p className="font-label-nav text-label-nav uppercase tracking-[0.16em] text-tertiary">
                    {office.label}
                  </p>
                )}
                <MapPin className="text-tertiary" size={18} strokeWidth={2} />
              </div>

              {office.city && (
                <h3 className="mt-1 font-headline-sm text-headline-sm text-primary">{office.city}</h3>
              )}

              {office.addressLines && office.addressLines.length > 0 && (
                <div className="mt-4 space-y-1 font-body-md text-body-md text-on-surface-variant">
                  {office.addressLines.map((line, lineIndex) =>
                    line?.line ? <p key={line.id || lineIndex}>{line.line}</p> : null,
                  )}
                </div>
              )}

              {(office.phone || office.email) && (
                <div className="mt-5 space-y-2 border-l border-outline-variant pl-4">
                  {office.phone && (
                    <a
                      className="flex items-center gap-2 font-label-sm text-label-sm text-primary hover:text-tertiary transition-colors"
                      href={`tel:${office.phone.replace(/\s/g, '')}`}
                    >
                      <Phone size={15} strokeWidth={2} />
                      {office.phone}
                    </a>
                  )}
                  {office.email && (
                    <a
                      className="flex items-center gap-2 font-label-sm text-label-sm text-primary hover:text-tertiary transition-colors"
                      href={`mailto:${office.email}`}
                    >
                      <Mail size={15} strokeWidth={2} />
                      {office.email}
                    </a>
                  )}
                </div>
              )}

              {typeof office.image === 'object' && office.image !== null && (
                <div className="mt-5 overflow-hidden">
                  <Media imgClassName="h-[170px] w-full object-cover" resource={office.image} />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
