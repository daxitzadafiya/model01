/**
 * Optional server-side CRM proxy using Globals → Optima CRM credentials.
 */
import { NextResponse } from 'next/server'

import { getCRMConfig, postToCRM } from '@/utilities/crmApi.server'
import { extractCRMList, extractCRMTotal } from '@/utilities/crmProperties'

export async function POST(request: Request) {
  const config = await getCRMConfig()

  if (!config) {
    return NextResponse.json(
      {
        error:
          'CRM API is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
      },
      { status: 500 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const response = await postToCRM('commercial_properties', body)

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM API failed (${response.status})` },
        { status: response.status },
      )
    }

    const data = (await response.json()) as unknown
    const list = extractCRMList(data)
    const total = extractCRMTotal(data, list.length)

    return NextResponse.json({
      commercial_properties: list,
      total,
      totalDocs: total,
    })
  } catch (error) {
    console.error('CRM proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
  }
}
