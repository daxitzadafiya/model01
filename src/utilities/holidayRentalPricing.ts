/** Vacation rental pricing — weekly seasonal rates, nights, per-person display. */

export type RentalSeason = {
  period_from?: string | number
  period_to?: string | number
  price_per_day?: number
  gross_day_price?: number
  price_per_week?: number
  weekly_price?: number
  gross_price?: number
  pricing_type?: string
  minimum_period?: number
}

export type HolidayRentalQuote = {
  nights: number
  guests: number
  /** Average daily villa rate across the stay */
  dailyPrice: number
  totalPrice: number
  /** Display-only: dailyPrice ÷ guests */
  perPersonPerNight: number
  minimumPeriod?: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export const parseDateOnly = (value?: string): Date | null => {
  if (!value?.trim()) return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export const toDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const countNights = (checkIn: Date, checkOut: Date): number => {
  const diff = checkOut.getTime() - checkIn.getTime()
  return Math.max(0, Math.round(diff / MS_PER_DAY))
}

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const parseSeasonBoundary = (value: unknown): Date | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isFinite(date.getTime()) ? startOfDay(date) : null
  }
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? startOfDay(new Date(parsed)) : null
}

export const seasonCoversDate = (season: RentalSeason, date: Date): boolean => {
  const from = parseSeasonBoundary(season.period_from)
  const to = parseSeasonBoundary(season.period_to)
  if (!from || !to) return false
  const day = startOfDay(date).getTime()
  return day >= from.getTime() && day <= to.getTime()
}

export const getDailyRateForSeason = (season: RentalSeason): number | undefined => {
  const perDay = pickNumber(season.price_per_day) ?? pickNumber(season.gross_day_price)
  if (perDay != null && perDay > 0) return perDay

  const weekly =
    pickNumber(season.price_per_week) ??
    pickNumber(season.weekly_price) ??
    pickNumber(season.gross_price)
  if (weekly != null && weekly > 0) return weekly / 7

  return perDay != null && perDay > 0 ? perDay : undefined
}

export const findSeasonForDate = (
  seasons: RentalSeason[],
  date: Date,
): RentalSeason | undefined => seasons.find((season) => seasonCoversDate(season, date))

export const parseRentalSeasons = (property: Record<string, unknown>): RentalSeason[] => {
  const raw = property.rental_seasons
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is RentalSeason => !!item && typeof item === 'object')
}

export const calculateHolidayRentalQuote = ({
  seasons,
  checkIn,
  checkOut,
  guests = 1,
}: {
  seasons: RentalSeason[]
  checkIn: string
  checkOut: string
  guests?: number
}): HolidayRentalQuote | null => {
  const from = parseDateOnly(checkIn)
  const to = parseDateOnly(checkOut)
  if (!from || !to || to <= from || seasons.length === 0) return null

  const nights = countNights(from, to)
  if (nights <= 0) return null

  let total = 0
  let minimumPeriod: number | undefined
  const cursor = new Date(from)

  for (let night = 0; night < nights; night++) {
    const season = findSeasonForDate(seasons, cursor)
    if (!season) return null

    const daily = getDailyRateForSeason(season)
    if (daily == null || daily <= 0) return null

    total += daily

    const seasonMinimum = pickNumber(season.minimum_period)
    if (seasonMinimum != null && seasonMinimum > 0) {
      minimumPeriod =
        minimumPeriod == null ? seasonMinimum : Math.max(minimumPeriod, seasonMinimum)
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  const guestCount = Math.max(1, guests)
  const dailyPrice = total / nights

  return {
    nights,
    guests: guestCount,
    dailyPrice,
    totalPrice: total,
    perPersonPerNight: dailyPrice / guestCount,
    minimumPeriod,
  }
}

export const formatEuro = (amount: number, fractionDigits = 0): string =>
  `€${amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`

export const formatHolidayPerPersonNight = (quote: HolidayRentalQuote): string =>
  `${formatEuro(quote.perPersonPerNight)} per person / night`

export const formatHolidayNightlyRate = (nightlyRate: number): string =>
  `${formatEuro(nightlyRate)} /night`

export const formatHolidayListingNightlyRate = (nightlyRate: number): string =>
  `from ${formatEuro(nightlyRate)} /night`

export const formatHolidayStayNightlyRate = (quote: HolidayRentalQuote): string =>
  formatHolidayNightlyRate(quote.dailyPrice)

export const formatHolidayTotalSummary = (quote: HolidayRentalQuote): string => {
  const roundedPerPerson = Math.round(quote.perPersonPerNight)
  const total = roundedPerPerson * quote.guests * quote.nights
  return `${formatEuro(roundedPerPerson)} × ${quote.guests} guests × ${quote.nights} nights ≈ ${formatEuro(total)}`
}

export const formatHolidayStayTotalSummary = (quote: HolidayRentalQuote): string => {
  const roundedNightly = Math.round(quote.dailyPrice)
  return `${formatEuro(roundedNightly)} × ${quote.nights} nights ≈ ${formatEuro(quote.totalPrice)}`
}

export type CRMPropertyBooking = {
  _id?: string
  /** Legacy aliases */
  arrival?: number | string
  departure?: number | string
  /** Optima view-by-ref fields */
  date_from?: number | string
  date_until?: number | string
  date_range?: number[]
  nights?: number
  sleeps?: string | number
  total_guests?: number
  status?: string
  client_name?: string
  end_price?: number
  new_price?: number
  reference?: string
  created_at?: string
}

export const parseBookingTimestamp = (value: unknown): Date | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isFinite(date.getTime()) ? startOfDay(date) : null
  }
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? startOfDay(new Date(parsed)) : null
}

/** Occupied night keys for one CRM booking (prefers `date_range`, then from/until). */
export const getBookingOccupiedDateKeys = (booking: CRMPropertyBooking): string[] => {
  const keys: string[] = []

  if (Array.isArray(booking.date_range) && booking.date_range.length > 0) {
    for (const ts of booking.date_range) {
      const day = parseBookingTimestamp(ts)
      if (day) keys.push(toDateKey(day))
    }
    return keys
  }

  const arrival = parseBookingTimestamp(booking.date_from ?? booking.arrival)
  const departure = parseBookingTimestamp(booking.date_until ?? booking.departure)
  if (!arrival || !departure || departure <= arrival) return keys

  const cursor = new Date(arrival)
  while (cursor < departure) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

/** Occupied nights from CRM `bookings` on property detail responses. */
export const getBlockedDateKeys = (bookings: CRMPropertyBooking[]): Set<string> => {
  const blocked = new Set<string>()

  for (const booking of bookings) {
    for (const key of getBookingOccupiedDateKeys(booking)) {
      blocked.add(key)
    }
  }

  return blocked
}

export type BookingDisplayStatus = 'enquiry' | 'booked' | 'other'

export const resolveBookingDisplayStatus = (status?: string): BookingDisplayStatus => {
  const normalized = status?.trim().toLowerCase() ?? ''
  if (normalized === 'enquiry' || normalized === 'inquiry') return 'enquiry'
  if (
    normalized === 'booked' ||
    normalized === 'confirmed' ||
    normalized === 'paid' ||
    normalized === 'active'
  ) {
    return 'booked'
  }
  return 'other'
}

export const formatBookingDisplayDate = (value: unknown): string => {
  const date = parseBookingTimestamp(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatBookingDateRange = (booking: CRMPropertyBooking): string => {
  const from = booking.date_from ?? booking.arrival
  const until = booking.date_until ?? booking.departure
  return `${formatBookingDisplayDate(from)} – ${formatBookingDisplayDate(until)}`
}

export const resolveBookingGuestCount = (booking: CRMPropertyBooking): number | undefined => {
  const total = pickNumber(booking.total_guests)
  if (total != null && total > 0) return total
  const sleeps = pickNumber(booking.sleeps)
  if (sleeps != null && sleeps > 0) return sleeps
  return undefined
}

export const resolveBookingPrice = (booking: CRMPropertyBooking): number | undefined => {
  const endPrice = pickNumber(booking.end_price)
  if (endPrice != null && endPrice > 0) return endPrice
  const newPrice = pickNumber(booking.new_price)
  if (newPrice != null && newPrice > 0) return newPrice
  return undefined
}

export const sortBookingsByArrival = (bookings: CRMPropertyBooking[]): CRMPropertyBooking[] =>
  [...bookings].sort((a, b) => {
    const aTs = parseBookingTimestamp(a.date_from ?? a.arrival)?.getTime() ?? 0
    const bTs = parseBookingTimestamp(b.date_from ?? b.arrival)?.getTime() ?? 0
    return aTs - bTs
  })

export const isRangeAvailable = (
  blocked: Set<string>,
  checkIn: string,
  checkOut: string,
): boolean => {
  const from = parseDateOnly(checkIn)
  const to = parseDateOnly(checkOut)
  if (!from || !to || to <= from) return false

  const cursor = new Date(from)
  const nights = countNights(from, to)

  for (let night = 0; night < nights; night++) {
    if (blocked.has(toDateKey(cursor))) return false
    cursor.setDate(cursor.getDate() + 1)
  }

  return true
}

export const dateKeyToUnixSeconds = (value: string): number | undefined => {
  // Treat `YYYY-MM-DD` as UTC midnight to avoid timezone-related off-by-one shifts.
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const isoUtcMidnight = `${match[1]}-${match[2]}-${match[3]}T00:00:00Z`
  const parsed = Date.parse(isoUtcMidnight)
  if (!Number.isFinite(parsed)) return undefined
  return Math.floor(parsed / 1000)
}
