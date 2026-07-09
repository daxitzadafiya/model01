import { isCRMTruthy } from '@/utilities/localizedValue'
import {
  calculateHolidayRentalQuote,
  findSeasonForDate,
  formatHolidayListingNightlyRate,
  formatHolidayNightlyRate,
  formatHolidayStayNightlyRate,
  formatHolidayStayTotalSummary,
  getDailyRateForSeason,
  parseRentalSeasons,
  type HolidayRentalQuote,
} from '@/utilities/holidayRentalPricing'

export const isHolidayRentalProperty = (property: Record<string, unknown>): boolean =>
  isCRMTruthy(property.st_rental)

export const parseHolidayGuestCount = (guests?: string): number => {
  if (!guests || guests === 'any') return 2
  const parsed = parseInt(guests.replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2
}

export type HolidayPriceVariant = 'listing' | 'detail'

export type HolidayPriceDisplay = {
  label: string
  summary?: string
  quote?: HolidayRentalQuote
  /** Nightly villa rate — used for sorting */
  nightlyRate?: number
}

export const HOLIDAY_SELECT_DATES_LABEL = 'Select dates for price'
export const HOLIDAY_PRICE_ON_DEMAND_LABEL = 'Price on demand'

/** Active `rental_seasons` nightly rate for a given date (defaults to today). */
export const resolveSeasonNightlyRateForDate = (
  property: Record<string, unknown>,
  date: Date = new Date(),
): number | undefined => {
  const season = findSeasonForDate(parseRentalSeasons(property), date)
  if (!season) return undefined
  const rate = getDailyRateForSeason(season)
  return rate != null && rate > 0 ? rate : undefined
}

export const resolveHolidayPriceDisplay = ({
  property,
  periodFrom,
  periodTo,
  guests,
  variant = 'listing',
}: {
  property: Record<string, unknown>
  periodFrom?: string
  periodTo?: string
  guests?: string
  variant?: HolidayPriceVariant
}): HolidayPriceDisplay => {
  const seasons = parseRentalSeasons(property)
  const hasDates = Boolean(periodFrom?.trim() && periodTo?.trim())

  if (hasDates) {
    const quote = calculateHolidayRentalQuote({
      seasons,
      checkIn: periodFrom!,
      checkOut: periodTo!,
      guests: parseHolidayGuestCount(guests),
    })

    if (!quote) {
      return { label: HOLIDAY_PRICE_ON_DEMAND_LABEL }
    }

    return {
      label: formatHolidayStayNightlyRate(quote),
      summary: formatHolidayStayTotalSummary(quote),
      quote,
      nightlyRate: quote.dailyPrice,
    }
  }

  const nightlyRate = resolveSeasonNightlyRateForDate(property)
  if (nightlyRate != null) {
    return {
      label:
        variant === 'detail'
          ? formatHolidayNightlyRate(nightlyRate)
          : formatHolidayListingNightlyRate(nightlyRate),
      nightlyRate,
    }
  }

  return { label: HOLIDAY_PRICE_ON_DEMAND_LABEL }
}

export const parseCRMPropertyBookings = (
  record: Record<string, unknown>,
): import('@/utilities/holidayRentalPricing').CRMPropertyBooking[] => {
  const bookings = record.bookings
  if (!Array.isArray(bookings)) return []
  return bookings.filter(
    (item) => !!item && typeof item === 'object',
  ) as import('@/utilities/holidayRentalPricing').CRMPropertyBooking[]
}
