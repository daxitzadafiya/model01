'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { Media as PayloadMedia, Page } from '@/payload-types'

import {
  PropertiesCarousel,
  type PropertiesCarouselItem,
} from '@/components/PropertiesCarousel'
import { postToCRM } from '@/utilities/crmApi'
import {
  parseCRMCustomQuery,
  normalizeCRMProperty as normalizeSharedCRMProperty,
  extractCRMList,
  withSimilarCommercialsDefault,
} from '@/utilities/crmProperties'
import { PROPERTY_CARD_IMAGE_SIZE } from '@/utilities/optimaImage'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import { useSiteLocale } from '@/utilities/useSiteLocale'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }>

type CRMQueryPreset = 'featured' | 'seaView' | 'custom'

export const PropertiesBlock: React.FC<Props> = ({
  subtitle,
  title,
  backgroundColor,
  showSoldBadge,
  properties,
  dataSource,
  crmPreset,
  crmLimit,
  crmQueryJson,
}) => {
  const [crmRawProperties, setCrmRawProperties] = useState<Record<string, unknown>[]>([])
  const [crmLoading, setCrmLoading] = useState(() => (dataSource ?? 'cms') === 'crm')
  const activeLocale = useSiteLocale()

  const source = dataSource ?? 'cms'
  const crmQueryType = (crmPreset ?? 'featured') as CRMQueryPreset
  const resolvedLimit = Math.max(1, crmLimit ?? 5)

  const normalizeCRMProperty = useCallback(
    (property: Record<string, unknown>): PropertiesCarouselItem => {
      const normalized = normalizeSharedCRMProperty(property, activeLocale, {
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
        location: normalized.location,
        reference: normalized.reference,
        detailHref: normalized.detailHref,
        title: normalized.title,
        beds: normalized.beds,
        baths: normalized.baths,
        sqft: normalized.sqft,
        price: normalized.price,
      }
    },
    [activeLocale],
  )

  const crmProperties = useMemo(
    () => crmRawProperties.map(normalizeCRMProperty),
    [crmRawProperties, normalizeCRMProperty],
  )

  const buildCRMQuery = useCallback(() => {
    const similarCommercials = getSimilarCommercialsQuery()

    if (crmQueryType === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
      const parsedQuery = parseCRMCustomQuery(crmQueryJson)
      if (parsedQuery) {
        const parsedOptions =
          parsedQuery.options && typeof parsedQuery.options === 'object'
            ? (parsedQuery.options as Record<string, unknown>)
            : {}
        const parsedBaseQuery =
          parsedQuery.query && typeof parsedQuery.query === 'object'
            ? (parsedQuery.query as Record<string, unknown>)
            : {}

        return {
          ...parsedQuery,
          options: {
            ...parsedOptions,
            page: 1,
            limit: resolvedLimit,
          },
          query: withSimilarCommercialsDefault(parsedBaseQuery),
        }
      }

      console.error('Invalid CRM custom query JSON. Sending empty custom query.')
      return {
        options: {
          page: 1,
          limit: resolvedLimit,
        },
        query: withSimilarCommercialsDefault({}),
      }
    }

    if (crmQueryType === 'seaView') {
      return {
        options: {
          page: 1,
          limit: resolvedLimit,
        },
        query: {
          ...similarCommercials,
          archived: { $ne: true },
          $and: [{ 'views.sea': true }],
          sale: true,
          status: { $in: ['Available', 'Under Offer'] },
        },
      }
    }

    return {
      options: {
        page: 1,
        limit: resolvedLimit,
      },
      query: {
        ...similarCommercials,
        archived: { $ne: true },
        sale: true,
        featured: true,
        status: { $in: ['Available', 'Under Offer'] },
      },
    }
  }, [crmQueryJson, crmQueryType, resolvedLimit])

  const normalizedCMSProperties: PropertiesCarouselItem[] =
    properties?.map((property) => ({
      imageResource:
        typeof property.image === 'object' && property.image !== null ? property.image : undefined,
      location: property.location || 'Greece',
      reference: undefined,
      title: property.title || 'Property',
      beds: property.beds ?? undefined,
      baths: property.baths ?? undefined,
      sqft: property.sqft ?? undefined,
      price: property.price || 'Price on request',
    })) ?? []

  const displayProperties = source === 'crm' ? crmProperties : normalizedCMSProperties

  useEffect(() => {
    if (source !== 'crm') {
      setCrmRawProperties([])
      setCrmLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchProperties = async () => {
      setCrmLoading(true)
      try {
        const response = await postToCRM('commercial_properties', buildCRMQuery(), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`CRM API failed (${response.status})`)
        }

        const data = (await response.json()) as unknown
        setCrmRawProperties(extractCRMList(data))
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch CRM properties.', error)
          setCrmRawProperties([])
        }
      } finally {
        if (!controller.signal.aborted) setCrmLoading(false)
      }
    }

    void fetchProperties()

    return () => controller.abort()
  }, [buildCRMQuery, source])

  return (
    <PropertiesCarousel
      subtitle={subtitle}
      title={title ?? 'Properties'}
      properties={displayProperties}
      loading={source === 'crm' && crmLoading}
      backgroundColor={backgroundColor ?? 'surface'}
      showSoldBadge={Boolean(showSoldBadge)}
      useCrmStatus={source === 'crm'}
    />
  )
}
