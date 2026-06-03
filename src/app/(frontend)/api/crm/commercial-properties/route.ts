/**
 * Optional server-side CRM proxy. Property list & home Properties block call
 * Optima directly via postToCRM() + NEXT_PUBLIC_CRM_API_URL (same as PHP).
 */
import { NextResponse } from 'next/server'

import { getCRMConfig, postToCRM } from '@/utilities/crmApi'
import { extractCRMList, extractCRMTotal } from '@/utilities/crmProperties'

export async function POST(request: Request) {
  const config = getCRMConfig()

  if (!config) {
    return NextResponse.json(
      {
        error:
          'CRM API is not configured. Set NEXT_PUBLIC_CRM_API_URL and NEXT_PUBLIC_CRM_API_KEY in .env',
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
