import { isCRMTruthy } from '@/utilities/localizedValue'
import type { PropertyDetailListingContext } from '@/utilities/propertyDetailListingContext'

export type PropertyInquiryContext = {
  reference?: string
  /** CRM MongoDB _id */
  interestId?: string
  otherReference?: string
  assignedTo?: string
  transactionType?: string
  typeOneKey?: string
  typeTwoKey?: string
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

const pickNumericKey = (candidate: unknown): string | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  return pickString(candidate) || undefined
}

/** Mirrors legacy PHP property inquiry hidden input for transaction_types. */
export function resolvePropertyInquiryTransactionType(
  property: Record<string, unknown>,
): string {
  if (isCRMTruthy(property.sale)) return 'Buy'
  if (isCRMTruthy(property.rent) || isCRMTruthy(property.lt_rental)) return 'long term rental'
  if (isCRMTruthy(property.st_rental)) return 'holiday rental'
  return 'Buy'
}

/** Pick inquiry transaction type from listing context when property is multi-listed. */
export function resolvePropertyInquiryTransactionTypeForContext(
  property: Record<string, unknown>,
  listingContext?: PropertyDetailListingContext,
): string {
  switch (listingContext) {
    case 'forHoliday':
      return 'holiday rental'
    case 'forRent':
      return 'long term rental'
    case 'forSale':
    case 'forSold':
      return 'Buy'
    default:
      return resolvePropertyInquiryTransactionType(property)
  }
}

export function extractPropertyInquiryContext(
  raw: Record<string, unknown>,
  normalized: { reference?: string; id?: string },
  listingContext?: PropertyDetailListingContext,
): PropertyInquiryContext {
  const reference = normalized.reference
  const interestId = normalized.id

  const otherReference = pickString(raw.other_reference) || undefined
  const transactionType = resolvePropertyInquiryTransactionTypeForContext(raw, listingContext)
  const typeOneKey = pickNumericKey(raw.type_one_key)
  const typeTwoKey = pickNumericKey(raw.type_two_key)

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
    transactionType,
    typeOneKey,
    typeTwoKey,
  }
}

export const COMMERCIAL_PROFILE_TYPE_ONE_FIELD = 'commercial_profile[type_one][]'
export const COMMERCIAL_PROFILE_TYPE_TWO_FIELD = 'commercial_profile[type_two][]'

export function buildPropertyInquiryHiddenFields(
  context: PropertyInquiryContext,
): Array<{ field: string; value: string }> {
  const fields: Array<{ field: string; value: string }> = [
    { field: 'property', value: context.reference ?? '' },
    { field: 'p_type', value: 'commercial_property' },
    { field: 'interest', value: context.interestId ?? '' },
    { field: 'to_email', value: context.assignedTo ?? '' },
    { field: 'transaction_types', value: context.transactionType ?? 'Buy' },
    { field: 'source', value: 'web-client' },
  ]

  if (context.otherReference) {
    fields.push({ field: 'other_reference', value: context.otherReference })
  }

  if (context.typeOneKey) {
    fields.push({ field: COMMERCIAL_PROFILE_TYPE_ONE_FIELD, value: context.typeOneKey })
  }

  if (context.typeTwoKey) {
    fields.push({ field: COMMERCIAL_PROFILE_TYPE_TWO_FIELD, value: context.typeTwoKey })
  }

  return fields
}
