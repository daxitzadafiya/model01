/**
 * Server proxy for cities within selected location groups (coasts).
 */
import { NextResponse } from 'next/server'

import { postToCRMWithUserKey } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'
import type { CRMListingPreset } from '@/utilities/crmProperties'

type RequestBody = {
  locationGroup?: number[]
  preset?: CRMListingPreset
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const locationGroup = (body.locationGroup ?? []).filter(
    (key) => typeof key === 'number' && Number.isFinite(key),
  )

  if (!locationGroup.length) {
    return NextResponse.json({ docs: [], total: 0 })
  }

  const preset = body.preset ?? 'forSale'
  const propStatus = preset === 'sold' ? (['Sold'] as const) : (['Available', 'Under Offer'] as const)

  try {
    const response = await postToCRMWithUserKey(
      'locationgroups/get-location-groups-with-properties',
      {
        query: {
          sort: 'en',
          order: 'DESC',
          prop_status: propStatus,
          allow_cities: true,
          location_group: locationGroup,
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM cities failed (${response.status})` },
        { status: response.status },
      )
    }

    const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('CRM location group cities proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 502 })
  }
}
