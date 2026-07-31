import type { Block, Field, PayloadRequest } from 'payload'

import { link } from '@/fields/link'
import { a, aString } from '@/utilities/adminI18n'
import { parseVimeoVideoId, parseYouTubeVideoId } from '@/utilities/heroVideo'

type ValidateArgs = {
  siblingData?: Record<string, unknown>
  req?: PayloadRequest
}

const isImageMedia = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType !== 'video'

const isSingleImage = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType !== 'video' && siblingData?.imageMode !== 'slider'

const isImageSlider = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType !== 'video' && siblingData?.imageMode === 'slider'

const isVideoMedia = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType === 'video'

const isYouTubeVideo = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType === 'video' && siblingData?.videoSource === 'youtube'

const isVimeoVideo = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType === 'video' && siblingData?.videoSource === 'vimeo'

const isUploadedVideo = (_: unknown, siblingData?: Record<string, unknown>) =>
  siblingData?.mediaType === 'video' && siblingData?.videoSource === 'upload'

const mediaFields: Field[] = [
  {
    name: 'mediaType',
    type: 'select',
    label: a('admin.blocks.heroBlock.mediaTypeLabel', 'Background Media Type'),
    defaultValue: 'image',
    required: true,
    options: [
      { label: a('admin.blocks.heroBlock.mediaTypeImage', 'Image'), value: 'image' },
      { label: a('admin.blocks.heroBlock.mediaTypeVideo', 'Video'), value: 'video' },
    ],
    admin: {
      description: a(
        'admin.blocks.heroBlock.mediaTypeDescription',
        'Choose between a static image, image slider, or video background.',
      ),
    },
  },
  {
    name: 'imageMode',
    type: 'select',
    label: a('admin.blocks.heroBlock.imageModeLabel', 'Image Display Mode'),
    defaultValue: 'single',
    options: [
      { label: a('admin.blocks.heroBlock.imageModeSingle', 'Single Image'), value: 'single' },
      { label: a('admin.blocks.heroBlock.imageModeSlider', 'Image Slider'), value: 'slider' },
    ],
    admin: {
      condition: isImageMedia,
      description: a(
        'admin.blocks.heroBlock.imageModeDescription',
        'Display one image or rotate through multiple images.',
      ),
    },
  },
  {
    name: 'backgroundImage',
    type: 'upload',
    relationTo: 'media',
    label: a('admin.blocks.heroBlock.backgroundImageLabel', 'Background Image'),
    admin: {
      condition: isSingleImage,
      description: a(
        'admin.blocks.heroBlock.backgroundImageDescription',
        'Full-width hero background image.',
      ),
    },
    validate: (value: unknown, { siblingData, req }: ValidateArgs) => {
      const data = siblingData
      if (data?.mediaType === 'video' || data?.imageMode === 'slider') return true
      if (!value)
        return aString(
          'admin.blocks.heroBlock.backgroundImageRequired',
          'A background image is required for single-image mode.',
          req?.i18n?.language,
        )
      return true
    },
  },
  {
    name: 'sliderImages',
    type: 'array',
    label: a('admin.blocks.heroBlock.sliderImagesLabel', 'Slider Images'),
    labels: {
      singular: a('admin.blocks.heroBlock.sliderImageSingular', 'Slider Image'),
      plural: a('admin.blocks.heroBlock.sliderImagesPlural', 'Slider Images'),
    },
    minRows: 2,
    admin: {
      condition: isImageSlider,
      description: a(
        'admin.blocks.heroBlock.sliderImagesDescription',
        'Add at least two images for the hero slider.',
      ),
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
        label: a('admin.blocks.heroBlock.sliderImageLabel', 'Image'),
      },
    ],
    validate: (value: unknown, { siblingData, req }: ValidateArgs) => {
      const data = siblingData
      if (data?.mediaType !== 'image' || data?.imageMode !== 'slider') return true
      if (!Array.isArray(value) || value.length < 2) {
        return aString(
          'admin.blocks.heroBlock.sliderImagesMinRows',
          'Add at least two images for the slider.',
          req?.i18n?.language,
        )
      }
      return true
    },
  },
  {
    name: 'sliderAutoplay',
    type: 'checkbox',
    label: a('admin.blocks.heroBlock.sliderAutoplayLabel', 'Autoplay Slider'),
    defaultValue: true,
    admin: {
      condition: isImageSlider,
    },
  },
  {
    name: 'sliderInterval',
    type: 'number',
    label: a('admin.blocks.heroBlock.sliderIntervalLabel', 'Autoplay Interval (seconds)'),
    defaultValue: 5,
    min: 2,
    max: 15,
    admin: {
      condition: (_, siblingData) => isImageSlider(_, siblingData) && siblingData?.sliderAutoplay !== false,
      description: a(
        'admin.blocks.heroBlock.sliderIntervalDescription',
        'Time between slide transitions when autoplay is enabled.',
      ),
    },
  },
  {
    name: 'videoSource',
    type: 'select',
    label: a('admin.blocks.heroBlock.videoSourceLabel', 'Video Source'),
    defaultValue: 'youtube',
    options: [
      { label: a('admin.blocks.heroBlock.videoSourceYoutube', 'YouTube'), value: 'youtube' },
      { label: a('admin.blocks.heroBlock.videoSourceVimeo', 'Vimeo'), value: 'vimeo' },
      { label: a('admin.blocks.heroBlock.videoSourceUpload', 'Uploaded Video'), value: 'upload' },
    ],
    admin: {
      condition: isVideoMedia,
    },
  },
  {
    name: 'youtubeUrl',
    type: 'text',
    label: a('admin.blocks.heroBlock.youtubeUrlLabel', 'YouTube URL'),
    admin: {
      condition: isYouTubeVideo,
      description: a(
        'admin.blocks.heroBlock.youtubeUrlDescription',
        'Paste a YouTube watch or share URL.',
      ),
    },
    validate: (value: unknown, { siblingData, req }: ValidateArgs) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'youtube') return true
      if (!value || typeof value !== 'string' || !value.trim())
        return aString(
          'admin.blocks.heroBlock.youtubeUrlRequired',
          'A YouTube URL is required.',
          req?.i18n?.language,
        )
      if (!parseYouTubeVideoId(value))
        return aString(
          'admin.blocks.heroBlock.youtubeUrlInvalid',
          'Enter a valid YouTube URL.',
          req?.i18n?.language,
        )
      return true
    },
  },
  {
    name: 'vimeoUrl',
    type: 'text',
    label: a('admin.blocks.heroBlock.vimeoUrlLabel', 'Vimeo URL'),
    admin: {
      condition: isVimeoVideo,
      description: a(
        'admin.blocks.heroBlock.vimeoUrlDescription',
        'Paste a Vimeo page or player URL.',
      ),
    },
    validate: (value: unknown, { siblingData, req }: ValidateArgs) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'vimeo') return true
      if (!value || typeof value !== 'string' || !value.trim())
        return aString(
          'admin.blocks.heroBlock.vimeoUrlRequired',
          'A Vimeo URL is required.',
          req?.i18n?.language,
        )
      if (!parseVimeoVideoId(value))
        return aString(
          'admin.blocks.heroBlock.vimeoUrlInvalid',
          'Enter a valid Vimeo URL.',
          req?.i18n?.language,
        )
      return true
    },
  },
  {
    name: 'videoUpload',
    type: 'upload',
    relationTo: 'media',
    label: a('admin.blocks.heroBlock.videoUploadLabel', 'Background Video'),
    admin: {
      condition: isUploadedVideo,
      description: a(
        'admin.blocks.heroBlock.videoUploadDescription',
        'Upload an MP4 or WebM file. Video plays muted and loops automatically.',
      ),
    },
    validate: (value: unknown, { siblingData, req }: ValidateArgs) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'upload') return true
      if (!value)
        return aString(
          'admin.blocks.heroBlock.videoUploadRequired',
          'An uploaded video is required.',
          req?.i18n?.language,
        )
      return true
    },
  },
]

export const HeroBlock: Block = {
  slug: 'heroBlock',
  interfaceName: 'HeroBlock',
  labels: {
    singular: a('admin.blocks.heroBlock.singular', 'Hero Block'),
    plural: a('admin.blocks.heroBlock.plural', 'Hero Blocks'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Discover Exceptional Properties in Greece.',
      localized: true,
      label: a('admin.blocks.heroBlock.titleLabel', 'Title'),
      admin: {
        description: a(
          'admin.blocks.heroBlock.titleDescription',
          'Edit in English only. Other languages refresh via DeepL when English changes on save.',
        ),
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      defaultValue: 'View All Properties',
      localized: true,
      label: a('admin.blocks.heroBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.heroBlock.buttonTextDescription',
          'Edit in English only. Other languages refresh via DeepL when English changes on save.',
        ),
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.heroBlock.ctaLinkLabel', 'Button Link'),
        admin: {
          description: a(
            'admin.blocks.heroBlock.ctaLinkDescription',
            'Where the hero button navigates to (e.g. Property for Sale page).',
          ),
        },
      },
    }),
    ...mediaFields,
    {
      name: 'showSearch',
      type: 'checkbox',
      label: a('admin.blocks.heroBlock.showSearchLabel', 'Show Search Bar on Hero'),
      defaultValue: true,
    },
    {
      name: 'defaultPropertyTab',
      type: 'select',
      label: a('admin.blocks.heroBlock.defaultPropertyTabLabel', 'Default Selected Property Tab'),
      defaultValue: 'sale',
      options: [
        { label: a('admin.blocks.heroBlock.propertyTabSale', 'Sale Properties'), value: 'sale' },
        { label: a('admin.blocks.heroBlock.propertyTabRental', 'Rental Properties'), value: 'rental' },
        { label: a('admin.blocks.heroBlock.propertyTabHoliday', 'Holiday Properties'), value: 'holiday' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.showSearch !== false,
      },
    },
    {
      name: 'defaultCountry',
      type: 'select',
      label: a('admin.blocks.heroBlock.defaultCountryLabel', 'Default Country (Sale Properties only)'),
      defaultValue: 'spain',
      options: [
        { label: a('admin.blocks.heroBlock.countrySpain', 'Spain'), value: 'spain' },
        { label: a('admin.blocks.heroBlock.countryFrance', 'France'), value: 'france' },
        { label: a('admin.blocks.heroBlock.countryPortugal', 'Portugal'), value: 'portugal' },
        { label: a('admin.blocks.heroBlock.countryOthers', 'Others'), value: 'others' },
      ],
      admin: {
        hidden: true,
        description: a(
          'admin.blocks.heroBlock.defaultCountryDescription',
          'Deprecated — set Default on a country under Collections → Countries instead.',
        ),
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'searchResultsLink',
        label: a('admin.blocks.heroBlock.searchResultsLinkLabel', 'Search Results Page'),
        admin: {
          description: a(
            'admin.blocks.heroBlock.searchResultsLinkDescription',
            'Where the hero property search sends visitors (e.g. your All Properties page).',
          ),
          condition: (_, siblingData) => siblingData?.showSearch !== false,
        },
        defaultValue: {
          type: 'custom',
          url: '/all-properties',
        },
      },
    }),
  ],
}
