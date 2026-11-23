import type { Language } from '@payloadcms/translations'
import { bg } from '@payloadcms/translations/languages/bg'
import { cs } from '@payloadcms/translations/languages/cs'
import { da } from '@payloadcms/translations/languages/da'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fr } from '@payloadcms/translations/languages/fr'
import { hr } from '@payloadcms/translations/languages/hr'
import { hu } from '@payloadcms/translations/languages/hu'
import { it } from '@payloadcms/translations/languages/it'
import { nl } from '@payloadcms/translations/languages/nl'
import { pl } from '@payloadcms/translations/languages/pl'
import { pt } from '@payloadcms/translations/languages/pt'
import { ro } from '@payloadcms/translations/languages/ro'
import { rsLatin } from '@payloadcms/translations/languages/rsLatin'
import { ru } from '@payloadcms/translations/languages/ru'
import { sv } from '@payloadcms/translations/languages/sv'
import { tr } from '@payloadcms/translations/languages/tr'
import { uk } from '@payloadcms/translations/languages/uk'

import { getCmsLocaleLabel } from '@/i18n/locales'

/**
 * Payload admin UI language packs available for Account → Language.
 * Codes here can appear in that dropdown when enabled in Globals → Localization.
 *
 * Official `@payloadcms/translations` packs are preferred. Locales without a pack
 * (el, fi) reuse English chrome with the CMS display name so they still appear.
 * Serbian (`sr`) maps to Payload's `rs-latin` pack.
 */
export function withLanguageLabel(pack: Language, label: string): Language {
  return {
    ...pack,
    translations: {
      ...pack.translations,
      general: {
        ...pack.translations.general,
        thisLanguage: label,
      },
    },
  } as Language
}

function pack(code: string, language: Language): Language {
  return withLanguageLabel(language, getCmsLocaleLabel(code))
}

/** English chrome + CMS label — used when Payload has no UI pack for a content locale. */
function englishFallback(code: string): Language {
  return pack(code, en)
}

export const adminLanguagePacks = {
  en: pack('en', en),
  de: pack('de', de),
  el: englishFallback('el'),
  fr: pack('fr', fr),
  es: pack('es', es),
  it: pack('it', it),
  nl: pack('nl', nl),
  fi: englishFallback('fi'),
  ru: pack('ru', ru),
  pl: pack('pl', pl),
  uk: pack('uk', uk),
  ro: pack('ro', ro),
  tr: pack('tr', tr),
  hu: pack('hu', hu),
  sv: pack('sv', sv),
  cs: pack('cs', cs),
  pt: pack('pt', pt),
  sr: pack('sr', rsLatin),
  bg: pack('bg', bg),
  hr: pack('hr', hr),
  da: pack('da', da),
} as const satisfies Record<string, Language>

export type AdminLanguageCode = keyof typeof adminLanguagePacks

export function isAdminLanguageCode(code: string): code is AdminLanguageCode {
  return Object.prototype.hasOwnProperty.call(adminLanguagePacks, code)
}

/** Narrow helper for typing supportedLanguages keys. */
export type AdminSupportedLanguages = Partial<typeof adminLanguagePacks> & {
  en: (typeof adminLanguagePacks)['en']
}
