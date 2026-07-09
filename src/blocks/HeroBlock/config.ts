import type { Block, Field } from 'payload'

import { link } from '@/fields/link'
import { parseVimeoVideoId, parseYouTubeVideoId } from '@/utilities/heroVideo'

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
    label: 'Background Media Type',
    defaultValue: 'image',
    required: true,
    options: [
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
    ],
    admin: {
      description: 'Choose between a static image, image slider, or video background.',
    },
  },
  {
    name: 'imageMode',
    type: 'select',
    label: 'Image Display Mode',
    defaultValue: 'single',
    options: [
      { label: 'Single Image', value: 'single' },
      { label: 'Image Slider', value: 'slider' },
    ],
    admin: {
      condition: isImageMedia,
      description: 'Display one image or rotate through multiple images.',
    },
  },
  {
    name: 'backgroundImage',
    type: 'upload',
    relationTo: 'media',
    admin: {
      condition: isSingleImage,
      description: 'Full-width hero background image.',
    },
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      const data = siblingData
      if (data?.mediaType === 'video' || data?.imageMode === 'slider') return true
      if (!value) return 'A background image is required for single-image mode.'
      return true
    },
  },
  {
    name: 'sliderImages',
    type: 'array',
    label: 'Slider Images',
    minRows: 2,
    admin: {
      condition: isImageSlider,
      description: 'Add at least two images for the hero slider.',
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
      },
    ],
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      const data = siblingData
      if (data?.mediaType !== 'image' || data?.imageMode !== 'slider') return true
      if (!Array.isArray(value) || value.length < 2) {
        return 'Add at least two images for the slider.'
      }
      return true
    },
  },
  {
    name: 'sliderAutoplay',
    type: 'checkbox',
    label: 'Autoplay Slider',
    defaultValue: true,
    admin: {
      condition: isImageSlider,
    },
  },
  {
    name: 'sliderInterval',
    type: 'number',
    label: 'Autoplay Interval (seconds)',
    defaultValue: 5,
    min: 2,
    max: 15,
    admin: {
      condition: (_, siblingData) => isImageSlider(_, siblingData) && siblingData?.sliderAutoplay !== false,
      description: 'Time between slide transitions when autoplay is enabled.',
    },
  },
  {
    name: 'videoSource',
    type: 'select',
    label: 'Video Source',
    defaultValue: 'youtube',
    options: [
      { label: 'YouTube', value: 'youtube' },
      { label: 'Vimeo', value: 'vimeo' },
      { label: 'Uploaded Video', value: 'upload' },
    ],
    admin: {
      condition: isVideoMedia,
    },
  },
  {
    name: 'youtubeUrl',
    type: 'text',
    label: 'YouTube URL',
    admin: {
      condition: isYouTubeVideo,
      description: 'Paste a YouTube watch or share URL.',
    },
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'youtube') return true
      if (!value || typeof value !== 'string' || !value.trim()) return 'A YouTube URL is required.'
      if (!parseYouTubeVideoId(value)) return 'Enter a valid YouTube URL.'
      return true
    },
  },
  {
    name: 'vimeoUrl',
    type: 'text',
    label: 'Vimeo URL',
    admin: {
      condition: isVimeoVideo,
      description: 'Paste a Vimeo page or player URL.',
    },
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'vimeo') return true
      if (!value || typeof value !== 'string' || !value.trim()) return 'A Vimeo URL is required.'
      if (!parseVimeoVideoId(value)) return 'Enter a valid Vimeo URL.'
      return true
    },
  },
  {
    name: 'videoUpload',
    type: 'upload',
    relationTo: 'media',
    label: 'Background Video',
    admin: {
      condition: isUploadedVideo,
      description: 'Upload an MP4 or WebM file. Video plays muted and loops automatically.',
    },
    validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
      const data = siblingData
      if (data?.mediaType !== 'video' || data?.videoSource !== 'upload') return true
      if (!value) return 'An uploaded video is required.'
      return true
    },
  },
]

export const HeroBlock: Block = {
  slug: 'heroBlock',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Discover Exceptional Properties in Greece.',
      localized: true,
      admin: {
        description:
          'Edit in English only. Other languages refresh via DeepL when English changes on save.',
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      defaultValue: 'View All Properties',
      localized: true,
      admin: {
        description:
          'Edit in English only. Other languages refresh via DeepL when English changes on save.',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'Button Link',
        admin: {
          description: 'Where the hero button navigates to (e.g. Property for Sale page).',
        },
      },
    }),
    ...mediaFields,
    {
      name: 'showSearch',
      type: 'checkbox',
      label: 'Show Search Bar on Hero',
      defaultValue: true,
    },
    {
      name: 'defaultPropertyTab',
      type: 'select',
      label: 'Default Selected Property Tab',
      defaultValue: 'sale',
      options: [
        { label: 'Sale Properties', value: 'sale' },
        { label: 'Rental Properties', value: 'rental' },
        { label: 'Holiday Properties', value: 'holiday' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.showSearch !== false,
      },
    },
    {
      name: 'defaultCountry',
      type: 'select',
      label: 'Default Country (Sale Properties only)',
      defaultValue: 'spain',
      options: [
        { label: 'Spain', value: 'spain' },
        { label: 'France', value: 'france' },
        { label: 'Portugal', value: 'portugal' },
        { label: 'Others', value: 'others' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.showSearch !== false,
        description: 'Pre-selected country on the Sale Properties tab (defaults to Spain).',
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'searchResultsLink',
        label: 'Search Results Page',
        admin: {
          description:
            'Where the hero property search sends visitors (e.g. your All Properties page).',
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
