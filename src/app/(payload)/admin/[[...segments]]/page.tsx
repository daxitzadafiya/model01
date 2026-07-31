/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { getPayload } from 'payload'
import { importMap } from '../importMap'
import { ensureAdminI18nSynced } from '@/utilities/adminI18n'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = async ({ params, searchParams }: Args) => {
  // Wait for background onInit seed (or fill any missing Localization locales / HMR keys)
  // so field labels resolve to the Account Language (de/es/…).
  try {
    const payload = await getPayload({ config })
    await ensureAdminI18nSynced(payload)
  } catch {
    // ignore — admin still renders; labels fall back to English
  }

  return RootPage({ config, params, searchParams, importMap })
}

export default Page
