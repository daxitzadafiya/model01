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

    if (!sourceChanged && existingText) continue

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
    const existingFingerprint = targetRichText.has(path)
      ? lexicalPlainText(targetRichText.get(path))
      : ''

    if (!sourceChanged && existingFingerprint) continue

    const translated = await translateLexicalRichText(sourceValue, (text) =>
      translate(text, targetLocale),
    )

    if (translated && isLexicalRichText(translated)) {
      patches.set(path, { kind: 'richtext', value: translated })
    }
  }

  return patches
}

export function buildUpdateDataFromPatches(
  patches: DocumentFieldPatches,
): Record<string, unknown> | null {
  if (patches.size === 0) return null

  const data: Record<string, unknown> = {}

  let appliedCount = 0

  for (const [path, patch] of patches) {
    const applied =
      patch.kind === 'string'
        ? setLocalizedString(data, path, patch.value)
        : setLocalizedRichText(data, path, patch.value)

    if (applied) appliedCount++
  }

  return appliedCount > 0 ? data : null
}
