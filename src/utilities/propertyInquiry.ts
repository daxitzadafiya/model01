export type PropertyInquiryContext = {
  reference?: string
  /** CRM MongoDB _id */
  interestId?: string
  otherReference?: string
  assignedTo?: string
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

export function extractPropertyInquiryContext(
  raw: Record<string, unknown>,
  normalized: { reference?: string; id?: string },
): PropertyInquiryContext {
  const reference = normalized.reference
  const interestId = normalized.id

  const otherReference = pickString(raw.other_reference) || undefined

  const agentDetails = raw.agent_details
  const agent = raw.agent

  const assignedTo =
    pickString(raw.assigned_to) ||
    (agentDetails && typeof agentDetails === 'object'
      ? pickString((agentDetails as Record<string, unknown>).email)
      : '') ||
    (agent && typeof agent === 'object'
      ? pickString((agent as Record<string, unknown>).email)
      : '') ||
    process.env.NEXT_PUBLIC_DEFAULT_AGENT_EMAIL?.trim() ||
    undefined

  return {
    reference,
    interestId,
    otherReference,
    assignedTo,
  }
}

export function buildPropertyInquiryHiddenFields(
  context: PropertyInquiryContext,
): Array<{ field: string; value: string }> {
  const fields: Array<{ field: string; value: string }> = [
    { field: 'property', value: context.reference ?? '' },
    { field: 'p_type', value: 'commercial_property' },
    { field: 'interest', value: context.interestId ?? '' },
    { field: 'to_email', value: context.assignedTo ?? '' },
    { field: 'transaction_types', value: 'Buy' },
    { field: 'source', value: 'web-client' },
  ]

  if (context.otherReference) {
    fields.push({ field: 'other_reference', value: context.otherReference })
  }

  return fields
}
