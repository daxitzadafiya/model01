import { randomBytes } from 'node:crypto'

import {
  collectLocalizedRichText,
  collectLocalizedStrings,
  setLocalizedRichText,
  setLocalizedString,
} from './fieldPaths'
import { isLexicalRichText, lexicalPlainText, translateLexicalRichText } from './lexicalText'

export type DocumentFieldPatch =
  | { kind: 'string'; value: string }
  | { kind: 'richtext'; value: Record<string, unknown> }

export type DocumentFieldPatches = Map<string, DocumentFieldPatch>

export type DocumentFieldRegistry = {
  strings: readonly string[]
  richText: readonly string[]
}

function asRecord(doc: unknown): Record<string, unknown> {
  return doc as Record<string, unknown>
}

function collectStringFingerprints(
  doc: Record<string, unknown>,
  paths: readonly string[],
): Map<string, string> {
  const values = new Map<string, string>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedStrings(doc, fieldPath)) {
      values.set(field.path, field.value)
    }
  }

  return values
}

function collectRichTextFingerprints(
  doc: Record<string, unknown>,
  paths: readonly string[],
): Map<string, string> {
  const values = new Map<string, string>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedRichText(doc, fieldPath)) {
      const plainText = lexicalPlainText(field.value)
      if (plainText) values.set(field.path, plainText)
    }
  }

  return values
}

function collectFingerprints(
  doc: Record<string, unknown>,
  registry: DocumentFieldRegistry,
): Map<string, string> {
  return new Map([
    ...collectStringFingerprints(doc, registry.strings),
    ...collectRichTextFingerprints(doc, registry.richText),
  ])
}

function collectRichTextValues(
  doc: Record<string, unknown>,
  paths: readonly string[],
): Map<string, Record<string, unknown>> {
  const values = new Map<string, Record<string, unknown>>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedRichText(doc, fieldPath)) {
      values.set(field.path, field.value)
    }
  }

  return values
}

export function documentHasTranslatableFields(registry: DocumentFieldRegistry): boolean {
  return registry.strings.length > 0 || registry.richText.length > 0
}

export function documentHasSourceTranslatableContent(
  doc: Record<string, unknown> | null | undefined,
  registry: DocumentFieldRegistry,
): boolean {
  if (!doc || !documentHasTranslatableFields(registry)) return false

  return collectFingerprints(doc, registry).size > 0
}

export function documentLocalizedFieldsChanged(
  current: Record<string, unknown> | null | undefined,
  previous: Record<string, unknown> | null | undefined,
  registry: DocumentFieldRegistry,
): boolean {
  if (!current || !documentHasTranslatableFields(registry)) return false

  const currentValues = collectFingerprints(asRecord(current), registry)
  if (!previous) return currentValues.size > 0

  const previousValues = collectFingerprints(asRecord(previous), registry)

  for (const [path, value] of currentValues) {
    if (value !== (previousValues.get(path) ?? '')) return true
  }

  for (const [path, value] of previousValues) {
    if (value && !currentValues.has(path)) return true
  }

  return false
}

export async function buildDocumentPatches(
  source: Record<string, unknown>,
  previous: Record<string, unknown> | null | undefined,
  target: Record<string, unknown> | null | undefined,
  registry: DocumentFieldRegistry,
  translate: (text: string, targetLocale: string) => Promise<string | null>,
  targetLocale: string,
): Promise<DocumentFieldPatches> {
  const patches: DocumentFieldPatches = new Map()

  const sourceStrings = collectStringFingerprints(source, registry.strings)
  const previousStrings = previous ? collectStringFingerprints(previous, registry.strings) : new Map()
  const targetStrings = target ? collectStringFingerprints(target, registry.strings) : new Map()

  const sourceRichText = collectRichTextValues(source, registry.richText)
  const previousRichText = previous ? collectRichTextValues(previous, registry.richText) : new Map()
  const targetRichText = target ? collectRichTextValues(target, registry.richText) : new Map()

  for (const [path, sourceText] of sourceStrings) {
    const previousSourceText = previousStrings.get(path) ?? ''
    const sourceChanged = sourceText !== previousSourceText
    const existingText = targetStrings.get(path) ?? ''

    // Preserve existing target copy when source did not change (identity patch).
    // Update payloads are built from the source doc shape, so skipped fields
    // would otherwise be rewritten as English.
    if (!sourceChanged && existingText) {
      patches.set(path, { kind: 'string', value: existingText })
      continue
    }

    const translated = await translate(sourceText, targetLocale)
    if (translated) {
      patches.set(path, { kind: 'string', value: translated })
    }
  }

  for (const [path, sourceValue] of sourceRichText) {
    const sourceFingerprint = lexicalPlainText(sourceValue)
    if (!sourceFingerprint) continue

    const previousFingerprint = previousRichText.has(path)
      ? lexicalPlainText(previousRichText.get(path))
      : ''
    const sourceChanged = sourceFingerprint !== previousFingerprint
    const existingRichText = targetRichText.get(path)
    const existingFingerprint = existingRichText
      ? lexicalPlainText(existingRichText)
      : ''

    if (!sourceChanged && existingFingerprint && existingRichText) {
      patches.set(path, { kind: 'richtext', value: existingRichText })
      continue
    }

    const translated = await translateLexicalRichText(sourceValue, (text) =>
      translate(text, targetLocale),
    )

    if (translated && isLexicalRichText(translated)) {
      patches.set(path, { kind: 'richtext', value: translated })
    }
  }

  return patches
}

function topLevelKey(path: string): string {
  return path.split(/[.\[]/, 1)[0] ?? path
}

function newArrayRowId(): string {
  return randomBytes(12).toString('hex')
}

/**
 * SQLite stores localized array rows with `id` as a global primary key (not per-locale).
 * Reusing source-locale row IDs when writing another locale causes:
 * `UNIQUE constraint failed: footer_nav_items.id`
 *
 * Prefer existing target-locale IDs by index; otherwise mint new IDs.
 */
function ensureUniqueLocalizedArrayIds(node: unknown, targetNode: unknown): void {
  if (Array.isArray(node)) {
    const targetArray = Array.isArray(targetNode) ? targetNode : null

    for (let index = 0; index < node.length; index++) {
      const item = node[index]
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue

      const record = item as Record<string, unknown>
      const targetItem = targetArray?.[index]
      const targetId =
        targetItem && typeof targetItem === 'object' && !Array.isArray(targetItem)
          ? (targetItem as Record<string, unknown>).id
          : undefined

      if (typeof targetId === 'string' && targetId.trim()) {
        record.id = targetId.trim()
      } else {
        record.id = newArrayRowId()
      }

      ensureUniqueLocalizedArrayIds(
        record,
        targetItem && typeof targetItem === 'object' ? targetItem : null,
      )
    }
    return
  }

  if (!node || typeof node !== 'object') return

  const record = node as Record<string, unknown>
  const targetRecord =
    targetNode && typeof targetNode === 'object' && !Array.isArray(targetNode)
      ? (targetNode as Record<string, unknown>)
      : null

  for (const [key, value] of Object.entries(record)) {
    if (key === 'id') continue
    ensureUniqueLocalizedArrayIds(value, targetRecord?.[key])
  }
}

export function buildUpdateDataFromPatches(
  patches: DocumentFieldPatches,
  options?: {
    /** Source doc used to keep full array row shape (type/url/etc), not just translated labels. */
    baseDoc?: Record<string, unknown> | null
    /** Existing target-locale doc — reuse its array row IDs when present. */
    targetDoc?: Record<string, unknown> | null
  },
): Record<string, unknown> | null {
  if (patches.size === 0) return null

  const data: Record<string, unknown> = {}
  const baseDoc = options?.baseDoc ?? null

  if (baseDoc) {
    const keys = new Set<string>()
    for (const path of patches.keys()) {
      keys.add(topLevelKey(path))
    }

    for (const key of keys) {
      if (key in baseDoc) {
        data[key] = structuredClone(baseDoc[key])
      }
    }
  }

  let appliedCount = 0

  for (const [path, patch] of patches) {
    const applied =
      patch.kind === 'string'
        ? setLocalizedString(data, path, patch.value)
        : setLocalizedRichText(data, path, patch.value)

    if (applied) appliedCount++
  }

  if (appliedCount === 0) return null

  ensureUniqueLocalizedArrayIds(data, options?.targetDoc ?? null)

  return data
}
