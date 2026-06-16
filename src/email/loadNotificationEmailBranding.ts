import type { Payload } from 'payload'

import { parseThemeEmailColorsFromCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'
import type { NotificationEmailTheme } from '@/email/notificationEmailTheme'
import { resolveEmailLogoDataUri } from '@/email/resolveEmailLogoDataUri'
import type { Logo } from '@/payload-types'
import { getAppName } from '@/utilities/getAppName'

export type NotificationEmailBranding = {
  theme: NotificationEmailTheme
  logo: Logo | null
  logoSrc: string
  siteName: string
}

export async function loadNotificationEmailBranding(
  payload: Payload,
): Promise<NotificationEmailBranding> {
  const [themeGlobal, logo] = await Promise.all([
    payload.findGlobal({ slug: 'theme', overrideAccess: true }).catch(() => null),
    payload.findGlobal({ slug: 'logo', depth: 1, overrideAccess: true }).catch(() => null),
  ])

  const theme = parseThemeEmailColorsFromCustomCSS(themeGlobal?.customCSS) as NotificationEmailTheme
  const logoSrc = await resolveEmailLogoDataUri(logo)

  return {
    theme,
    logo,
    logoSrc,
    siteName: getAppName(logo),
  }
}
