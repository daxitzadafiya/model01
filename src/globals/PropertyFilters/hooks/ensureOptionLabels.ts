import type { FieldHook } from 'payload'

import { localeCodes } from '@/i18n/locales'

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function fallbackLabel(siblingData: Record<string, unknown> | undefined): string {
  const fromValue = textOrEmpty(siblingData?.value)
  if (fromValue) return fromValue.charAt(0).toUpperCase() + fromValue.slice(1)
  return 'Option'
}

function resolveLocales(req: unknown): readonly string[] {
  const localeCodesFromConfig = (
    req as {
      payload?: { config?: { localization?: false | { localeCodes?: string[] } } }
    } | null
  )?.payload?.config?.localization
  if (localeCodesFromConfig && localeCodesFromConfig.localeCodes?.length) {
    return localeCodesFromConfig.localeCodes
  }
  return localeCodes
}

function asLocaleRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function currentLocaleCode(req: unknown): string | undefined {
  const locale = (req as { locale?: unknown } | null)?.locale
  return typeof locale === 'string' && locale && locale !== 'all' ? locale : undefined
}

function isValuePlaceholder(text: string, rowValue: string): boolean {
  if (!text) return true
  if (!rowValue) return false
  if (text === rowValue) return true
  return text === rowValue.charAt(0).toUpperCase() + rowValue.slice(1)
}

function labelForLocale(label: unknown, locale: string | undefined): string {
  const text = textOrEmpty(label)
  if (text) return text
  const record = asLocaleRecord(label)
  if (!record || !locale) return ''
  return textOrEmpty(record[locale])
}

/**
 * Payload may submit localized labels as a locale map. Nested field hooks and
 * mergeLocaleActions expect a current-locale string — an object here gets nested
 * into the current locale column and the typed text is lost after save.
 */
export function flattenOptionLabelsForSave(value: unknown, locale?: string): unknown {
  if (!Array.isArray(value) || !locale || locale === 'all') return value

  return value.map((row) => {
    if (!row || typeof row !== 'object') return row
    const item = row as Record<string, unknown>
    const current = labelForLocale(item.label, locale)
    if (!current) return item
    return { ...item, label: current }
  })
}

/**
 * Build a non-null label for every CMS locale. Version tables insert one row per
 * locale and `label` is NOT NULL — empty keys crash SQLite on save.
 */
export function fillAllLocaleLabels(
  label: unknown,
  fallback: string,
  locales: readonly string[],
): Record<string, string> {
  const source = asLocaleRecord(label) ?? {}

  const existing = Object.values(source).find(
    (value) => typeof value === 'string' && value.trim(),
  )
  const base =
    (typeof existing === 'string' && existing.trim()) || fallback.trim() || 'Option'

  const record: Record<string, string> = {}
  for (const code of locales) {
    const current = source[code]
    record[code] = typeof current === 'string' && current.trim() ? current.trim() : base
  }
  return record
}

function applyIncomingLabel(args: {
  filled: Record<string, string>
  incomingText: string
  locales: readonly string[]
  locale: string | undefined
  previousCurrent: string
  rowValue: string
  source: unknown
}): void {
  const { filled, incomingText, locales, locale, previousCurrent, rowValue, source } = args
  const sourceRecord = asLocaleRecord(source)

  if (locale) filled[locale] = incomingText

  for (const code of locales) {
    if (code === locale) continue
    const existing = textOrEmpty(sourceRecord?.[code])
    if (isValuePlaceholder(existing, rowValue)) {
      filled[code] = incomingText
      continue
    }
    // Same display string in another locale was copied, not translated.
    if (previousCurrent && existing === previousCurrent && incomingText !== previousCurrent) {
      filled[code] = incomingText
    }
  }
}

/**
 * Version tables require a non-null `label` for every locale row.
 * Payload copies siblingDocWithLocales keys (including null) when flattening
 * locales. New array rows start with an empty sibling doc, so we seed every
 * configured locale before that merge runs.
 *
 * Always return a current-locale string on a single-locale save. Returning a
 * locale map makes Payload nest that map under the current locale and the
 * editor's text is discarded.
 */
export const ensureLocalizedOptionLabel: FieldHook = ({
  value,
  previousValue,
  siblingData,
  siblingDocWithLocales,
  req,
}) => {
  const sibling = siblingData as Record<string, unknown> | undefined
  const fallback = fallbackLabel(sibling)
  const locales = resolveLocales(req)
  const locale = currentLocaleCode(req)
  const incomingIsObject = Boolean(asLocaleRecord(value))
  const stored = (siblingDocWithLocales as { label?: unknown } | undefined)?.label
  const source = incomingIsObject ? value : stored

  const incomingText = incomingIsObject
    ? labelForLocale(value, locale)
    : textOrEmpty(value)

  const filled = fillAllLocaleLabels(source, incomingText || fallback, locales)
  const previousCurrent =
    labelForLocale(previousValue, locale) || (locale ? textOrEmpty(asLocaleRecord(stored)?.[locale]) : '')

  if (incomingText) {
    applyIncomingLabel({
      filled,
      incomingText,
      locales,
      locale,
      previousCurrent,
      rowValue: textOrEmpty(sibling?.value),
      source,
    })
  }

  const docWithLocales = siblingDocWithLocales as { label?: unknown } | undefined
  if (docWithLocales && typeof docWithLocales === 'object') {
    docWithLocales.label = filled
  }

  // locale:all saves need the full map. Single-locale saves must return a string
  // so mergeLocaleActions writes that string into the current locale column.
  if (!locale && incomingIsObject) return filled
  return incomingText || fallback
}

/** Keep rows that have a value/label, and backfill an empty string label from value. */
export function dropEmptyOptionRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value

  return value
    .filter((row) => {
      if (!row || typeof row !== 'object') return false
      const item = row as { value?: unknown; label?: unknown; isDeleted?: unknown }
      if (item.isDeleted) return true

      if (textOrEmpty(item.value)) return true
      if (textOrEmpty(item.label)) return true
      if (item.label && typeof item.label === 'object') {
        return Object.values(item.label).some((label) => textOrEmpty(label))
      }
      return false
    })
    .map((row) => {
      const item = row as Record<string, unknown>
      if (typeof item.label === 'string' && item.label.trim()) return item
      if (item.label && typeof item.label === 'object') return item
      const fallback = fallbackLabel(item)
      return { ...item, label: fallback }
    })
}
