import type { GlobalAfterChangeHook } from 'payload'

import { EMAIL_SETTINGS_FIELD_REGISTRY } from '@/utilities/autoTranslate/emailSettingsFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslateEmailSettingsContent: GlobalAfterChangeHook =
  createGlobalAutoTranslateHook({
    slug: 'emailSettings',
    registry: EMAIL_SETTINGS_FIELD_REGISTRY,
    // Template defaults often copy English into new locales — fill those on every
    // English (source) save without requiring an edit first. Unique translations stay.
    fillUntranslatedOnEverySourceSave: true,
  })
