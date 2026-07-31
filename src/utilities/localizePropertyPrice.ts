import {
  HOLIDAY_SELECT_DATES_LABEL,
  PRICE_ON_DEMAND_LABEL,
} from '@/utilities/crmHoliday'

/** Canonical English fallback — translate at display via `useTranslation`. */
export const PRICE_ON_REQUEST_LABEL = 'Price on request'

export type PropertyPriceLabels = {
  priceOnDemand: string
  priceOnRequest: string
  selectDatesForPrice: string
  from: string
  perNight: string
  perMonth: string
  perYear: string
  nights: string
  guests: string
  perPersonPerNight: string
}

/** Localize CRM/holiday price strings that are composed in English. */
export function localizePropertyPrice(
  price: string | undefined,
  labels: PropertyPriceLabels,
): string {
  if (!price) return ''

  if (price === PRICE_ON_DEMAND_LABEL) return labels.priceOnDemand
  if (price === PRICE_ON_REQUEST_LABEL) return labels.priceOnRequest
  if (price === HOLIDAY_SELECT_DATES_LABEL) return labels.selectDatesForPrice

  let result = price

  if (result.startsWith('from ')) {
    result = `${labels.from} ${result.slice(5)}`
  }

  result = result.replace(/ \/night$/u, ` ${labels.perNight}`)
  result = result.replace(/ \/ night$/u, ` ${labels.perNight}`)
  result = result.replace(/ per month$/u, ` ${labels.perMonth}`)
  result = result.replace(/ per year$/u, ` ${labels.perYear}`)
  result = result.replace(/ per person \/ night$/u, ` ${labels.perPersonPerNight}`)
  result = result.replace(/ × (\d+) nights/u, (_match, count: string) => ` × ${count} ${labels.nights}`)
  result = result.replace(/ × (\d+) guests/u, (_match, count: string) => ` × ${count} ${labels.guests}`)

  return result
}
