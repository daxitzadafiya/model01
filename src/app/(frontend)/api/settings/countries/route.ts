import { NextResponse } from 'next/server'

import { getSiteCountriesForSale } from '@/utilities/getSiteCountries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale')?.trim() || 'en'

  try {
    const countries = await getSiteCountriesForSale(locale)
    return NextResponse.json(countries)
  } catch (error) {
    console.error('Site countries error:', error)
    return NextResponse.json({ error: 'Failed to load countries' }, { status: 500 })
  }
}
