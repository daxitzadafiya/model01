import { sqliteAdapter } from '@payloadcms/db-sqlite'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Translations } from './collections/Translations'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { CookieConsent } from './globals/CookieConsent/config'
import { DeepLSettings } from './globals/DeepLSettings/config'
import { EmailSettings } from './globals/EmailSettings/config'
import { IntegrationsSettings } from './globals/IntegrationsSettings/config'
import { Localization } from './globals/Localization/config'
import { SiteLogo } from './globals/Logo/config'
import { OptimaCrmSettings } from './globals/OptimaCrmSettings/config'
import { PropertyFilters } from './globals/PropertyFilters/config'
import { PropertyMap } from './globals/PropertyMap/config'
import { emailAdapter } from './email/configureEmailAdapter'
import { Theme } from './globals/Theme/config'
import { payloadLocalization } from './i18n/locales'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { hasAdminCredentials } from './constants/adminUser'
import { ensureAdminUser } from './utilities/ensureAdminUser'
import { migrations } from './migrations'

// Import locales Languages
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fr } from '@payloadcms/translations/languages/fr'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: getServerSideURL(),

  // i18n localization
  i18n: {
    supportedLanguages: { en, de, fr, es },
  },

  // localization (content locales — see src/i18n/locales.ts to add codes)
  localization: payloadLocalization,

  email: emailAdapter,
  onInit: async (payload) => {
    // Skip during `next build` — workers initialize Payload in parallel and SQLite locks
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    if (hasAdminCredentials()) {
      await ensureAdminUser(payload)
    }
  },
  admin: {
    components: {
      graphics: {
        Icon: '@/components/Icon/Icon',
        Logo: '@/components/Logo/Logo',
      },
      views: {
        forgot: {
          Component: '@/components/ForgotPasswordView',
        },
      },

      // // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // // Feel free to delete this at any time. Simply remove the line below.
      // beforeLogin: ['@/components/BeforeLogin'],
      // // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // // Feel free to delete this at any time. Simply remove the line below.
      // beforeDashboard: ['@/components/BeforeDashboard'],
    },
    meta: {
      icons: [
        {
          rel: 'icon',
          url: '/site-favicon',
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
    // Use migrations in production; dev schema push leaves a batch=-1 marker that
    // blocks non-interactive `next build` with an interactive migrate prompt.
    push: false,
    prodMigrations: migrations,
  }),
  collections: [Pages, Posts, Media, Categories, Users, Translations],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [
    Header,
    Footer,
    Theme,
    Localization,
    SiteLogo,
    CookieConsent,
    PropertyMap,
    PropertyFilters,
    EmailSettings,
    OptimaCrmSettings,
    DeepLSettings,
    IntegrationsSettings,
  ],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
