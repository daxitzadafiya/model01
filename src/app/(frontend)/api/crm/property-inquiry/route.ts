import { NextResponse } from 'next/server'

import { submitContactToOptimaCrm } from '@/utilities/submitContactToOptimaCrm'

type InquiryBody = {
  name?: string
  email?: string
  phone?: string
  message?: string
  propertyTitle?: string
  propertyReference?: string
}

export async function POST(request: Request) {
  let body: InquiryBody

  try {
    body = (await request.json()) as InquiryBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const message = body.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
  }

  const propertyLine = body.propertyReference
    ? `Property reference: ${body.propertyReference}`
    : body.propertyTitle
      ? `Property: ${body.propertyTitle}`
      : ''

  const composedMessage = [message, propertyLine].filter(Boolean).join('\n\n')

  try {
    await submitContactToOptimaCrm([
      { field: 'forename', value: name },
      { field: 'email', value: email },
      { field: 'mobile_phone', value: body.phone?.trim() || '' },
      { field: 'message', value: composedMessage },
      { field: 'source', value: 'property-detail' },
      { field: 'gdpr_status', value: true },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Property inquiry error:', error)
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 502 })
  }
}
