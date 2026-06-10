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
import { isContactFormTitle } from '@/utilities/isContactFormSubmission'
import { sendFormSubmissionNotificationEmail } from '@/email/sendNotificationEmail'
import { submitContactToOptimaCrm } from '@/utilities/submitContactToOptimaCrm'
import { verifyRecaptchaToken } from '@/utilities/verifyRecaptcha'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Horizon estates` : 'Horizon estates'
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
          {
            name: 'syncToOptimaCrm',
            type: 'checkbox',
            defaultValue: false,
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'submissionLocale',
            type: 'text',
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
              description:
                'Site locale when the visitor submitted the form (for localized emails).',
            },
          },
        ]
      },
      hooks: {
        beforeChange: [
          async ({ data, req, operation }) => {
            if (operation !== 'create') return data

            const form = data?.form
            let formTitle: string | undefined

            if (typeof form === 'number') {
              try {
                const formDoc = await req.payload.findByID({
                  collection: 'forms',
                  id: form,
                  depth: 0,
                  overrideAccess: true,
                })
                formTitle = formDoc?.title
              } catch {
                // fall through
              }
            } else if (typeof form === 'object' && form !== null && 'title' in form) {
              formTitle = (form as { title?: string }).title
            }

            const syncToOptima =
             data?.syncToOptimaCrm === true || isContactFormTitle(formTitle)

            if (!syncToOptima) return data

            if (data?.recaptchaRequired === true) {
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
            }

            try {
              await submitContactToOptimaCrm(
                data?.submissionData,
                typeof data?.submissionLocale === 'string' ? data.submissionLocale : undefined,
              )
            } catch (error) {
              const message =
                error instanceof Error && error.message.trim()
                  ? error.message
                  : 'CRM submission failed. Please try again later.'
              throw new Error(message)
            }
            return data
          },
        ],
        afterChange: [
          async ({ doc, operation, req }) => {
            if (operation !== 'create') return

            try {
              await sendFormSubmissionNotificationEmail({
                payload: req.payload,
                doc,
              })
            } catch (error) {
              req.payload.logger.error({
                err: error,
                msg: 'Failed to send form submission notification email',
              })
            }
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
