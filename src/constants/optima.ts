export const OPTIMA_CONFIG = {
  imageUrlWithoutResize:
    process.env.NEXT_PUBLIC_OPTIMA_IMAGE_URL_WITHOUT_RESIZE ||
    'https://images.optima-crm.com/cms_medias/',
  imageUrl:
    process.env.NEXT_PUBLIC_OPTIMA_IMAGE_URL ||
    'https://images.optima-crm.com/resize/cms_medias/',
  /** PHP: self::$com_img — commercial property images (no /resize/) */
  commercialImageBase:
    process.env.NEXT_PUBLIC_OPTIMA_COM_IMG ||
    'https://images.optima-crm.com/commercial_images',
  /** PHP: self::$agency */
  agencyId: process.env.NEXT_PUBLIC_OPTIMA_AGENCY_ID || '',
  /** PHP: self::$property_img_resize_link */
  propertyResizeBase:
    process.env.NEXT_PUBLIC_OPTIMA_PROPERTY_RESIZE_BASE ||
    'https://images.optima-crm.com/resize/commercial_images/',
  siteId: process.env.NEXT_PUBLIC_OPTIMA_SITE_ID || '237',
} as const
