import type { PropertiesCarouselItem } from '@/components/PropertiesCarousel'
import { extractPropertyListPreloadImageUrls } from '@/components/PropertyList/propertyListImagePreload'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import {
  buildCRMListingQuery,
  normalizeCRMProperty,
  type CRMListingPreset,
} from '@/utilities/crmProperties'
import { fetchCRMPropertiesServer } from '@/utilities/crmProperties.server'
import { PROPERTY_CARD_IMAGE_SIZE } from '@/utilities/optimaImage'

type CarouselCrmPreset = Extract<CRMListingPreset, 'featured' | 'seaView'>

export async function fetchPropertiesCarouselServerData(
  preset: CarouselCrmPreset,
  limit: number,
): Promise<{ items: PropertiesCarouselItem[]; preloadImageUrls: string[] }> {
  const { locale } = await getActiveLocale()

  const body = buildCRMListingQuery({
    preset,
    page: 1,
    pageSize: Math.max(1, limit),
    sortParams: { featured: -1 },
  })

  const result = await fetchCRMPropertiesServer(body)

  const items = result.properties.map((property): PropertiesCarouselItem => {
    const normalized = normalizeCRMProperty(property, locale, {
      currencySymbolAfter: true,
      emptyPriceWhenMissing: true,
      attachmentImageSize: PROPERTY_CARD_IMAGE_SIZE,
      listingMode: 'sale',
    })

    return {
      id: normalized.id,
      imageUrl: normalized.imageUrl,
      imageUrls: normalized.imageUrls,
      statusBadgeLabel: normalized.statusBadgeLabel,
      crmStatus: normalized.crmStatus,
      location: normalized.location,
      reference: normalized.reference,
      detailHref: normalized.detailHref,
      title: normalized.title,
      beds: normalized.beds,
      baths: normalized.baths,
      sqft: normalized.sqft,
      price: normalized.price,
    }
  })

  return {
    items,
    preloadImageUrls: extractPropertyListPreloadImageUrls(result.properties),
  }
}
