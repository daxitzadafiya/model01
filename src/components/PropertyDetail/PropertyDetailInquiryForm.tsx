'use client'

import { CheckCircle2 } from 'lucide-react'
import React, { useState } from 'react'

import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  propertyTitle: string
  propertyReference?: string
}

export const PropertyDetailInquiryForm: React.FC<Props> = ({
  propertyTitle,
  propertyReference,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(
    `Hello, I'm interested in this property and would like to visit it.\nThank you.`,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${getClientSideURL()}/api/crm/property-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          propertyTitle,
          propertyReference,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'Failed to submit inquiry')
      }

      setHasSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit inquiry')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSubmitted) {
    return (
      <div className="sticky top-32 bg-white p-8 rounded-xl shadow-2xl border border-outline-variant/20">
        <div className="text-center py-6">
          <CheckCircle2 className="text-accent-gold mx-auto mb-4" size={48} strokeWidth={1.5} />
          <h3 className="text-headline-sm font-headline-sm text-primary mb-3">Request Received</h3>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Thank you. Our team will contact you shortly about {propertyTitle}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-32 bg-white p-8 rounded-xl shadow-2xl border border-outline-variant/20">
      <h3 className="text-headline-sm font-headline-sm text-primary mb-6">Contact Us</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-md text-error">
            {error}
          </p>
        )}
        <div>
          <label
            className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
            htmlFor="inquiry-name"
          >
            Full Name
          </label>
          <input
            id="inquiry-name"
            className="w-full bg-surface-cream border border-outline-variant rounded-lg p-3 focus:ring-accent-gold focus:border-accent-gold transition-all"
            placeholder="John Doe"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label
            className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
            htmlFor="inquiry-email"
          >
            Email Address
          </label>
          <input
            id="inquiry-email"
            className="w-full bg-surface-cream border border-outline-variant rounded-lg p-3 focus:ring-accent-gold focus:border-accent-gold transition-all"
            placeholder="john@example.com"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label
            className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
            htmlFor="inquiry-phone"
          >
            Phone Number
          </label>
          <input
            id="inquiry-phone"
            className="w-full bg-surface-cream border border-outline-variant rounded-lg p-3 focus:ring-accent-gold focus:border-accent-gold transition-all"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div>
          <label
            className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
            htmlFor="inquiry-message"
          >
            Message
          </label>
          <textarea
            id="inquiry-message"
            className="w-full bg-surface-cream border border-outline-variant rounded-lg p-3 focus:ring-accent-gold focus:border-accent-gold transition-all"
            rows={4}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <div className="pt-4">
          <button
            className="w-full bg-accent-gold text-white py-4 rounded-full text-label-nav font-label-nav uppercase font-bold hover:bg-primary transition-all duration-300 disabled:opacity-60 cursor-pointer"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Request'}
          </button>
          <p className="text-center text-[10px] text-on-surface-variant mt-4 uppercase tracking-tighter">
            By clicking submit, you agree to our privacy policy and terms.
          </p>
        </div>
      </form>
    </div>
  )
}
