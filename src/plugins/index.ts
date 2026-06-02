import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { verifyRecaptchaToken } from '@/utilities/verifyRecaptcha'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    formSubmissionOverrides: {
      fields: ({ defaultFields }) => {
        return [
          ...defaultFields,
          // Hidden fields used to verify public reCAPTCHA before accepting submissions.
          {
            name: 'recaptchaRequired',
            type: 'checkbox',
            defaultValue: false,
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'recaptchaToken',
            type: 'text',
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
        ]
      },
      hooks: {
        beforeChange: [
          async ({ data, req, operation }) => {
            if (operation !== 'create') return data

            const form = data?.form

            // Enforce reCAPTCHA ONLY for the public "Contact Form".
            // This prevents users from bypassing by modifying any client-sent flags.
            let isContactForm = false
            if (typeof form === 'number') {
              try {
                const formDoc = await req.payload.findByID({
                  collection: 'forms',
                  id: form,
                  depth: 0,
                  overrideAccess: true,
                })
                isContactForm = formDoc?.title === 'Contact Form'
              } catch {
                // If we can't determine the form type, fail closed and enforce reCAPTCHA.
                isContactForm = true
              }
            } else if (typeof form === 'object' && form !== null) {
              // In case Payload passes the populated object rather than just the ID.
              isContactForm = (form as any)?.title === 'Contact Form'
            }

            if (!isContactForm) return data

            const token = data?.recaptchaToken
            if (typeof token !== 'string' || !token) {
              throw new Error('Please complete reCAPTCHA before submitting.')
            }

            const forwardedFor = req.headers.get('x-forwarded-for')
            const remoteip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined

            const ok = await verifyRecaptchaToken({
              token,
              remoteip,
            })

            if (!ok) throw new Error('reCAPTCHA verification failed. Please try again.')

            return data
          },
        ],
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  mcpPlugin({
    collections: {
      pages: { enabled: true },
      posts: { enabled: true },
      categories: { enabled: { find: true } },
      media: { enabled: { find: true } },
    },
    globals: {
      header: { enabled: { find: true, update: true } },
      footer: { enabled: { find: true, update: true } },
    },
  }),
]
