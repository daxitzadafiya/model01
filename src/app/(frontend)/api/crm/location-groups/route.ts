/**
 * Server proxy for Yii location groups (coasts). Avoids browser CORS on the contact URL.
 */
import { NextResponse } from 'next/server'

import { getFromCRMContact } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'

const LOCATION_GROUPS_ROUTE = 'properties/location-groups-key-value'

export async function GET() {
  try {
    const response = await getFromCRMContact(LOCATION_GROUPS_ROUTE)

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM location groups failed (${response.status})` },
        { status: response.status },
      )
    }

    const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('CRM location groups proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch location groups' }, { status: 502 })
  }
}
