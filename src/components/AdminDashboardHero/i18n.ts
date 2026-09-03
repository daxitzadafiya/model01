import { aString } from '@/utilities/adminI18n'

/**
 * Registers dashboard hero copy for admin.* DeepL seed (en + account languages).
 * Imported from payload.config so keys exist before onInit seed runs.
 */
export const DASHBOARD_HERO_I18N = {
  eyebrow: ['admin.dashboardHero.eyebrow', 'Content workspace'],
  title: ['admin.dashboardHero.title', 'Shape every page of the site'],
  text: [
    'admin.dashboardHero.text',
    'Edit pages, stories, and settings with the same calm, gold-accented language as the public site.',
  ],
  chipPages: ['admin.dashboardHero.chipPages', 'Pages'],
  chipPosts: ['admin.dashboardHero.chipPosts', 'Posts'],
  chipGlobals: ['admin.dashboardHero.chipGlobals', 'Globals'],
} as const

for (const [key, english] of Object.values(DASHBOARD_HERO_I18N)) {
  aString(key, english)
}
