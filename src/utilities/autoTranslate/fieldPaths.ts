import { isLexicalRichText } from './lexicalText'

export type LocalizedStringField = {
  /** Stable path used for patch matching (array rows use their `id` when present). */
  path: string
  value: string
}

export type LocalizedRichTextField = {
  path: string
  value: Record<string, unknown>
}

type PathToken =
  | { type: 'key'; name: string }
  | { type: 'array'; selector: string }

/** Split `offices[].city` into walkable segments. */
export function parseFieldPath(fieldPath: string): Array<string | '[]'> {
  const segments: Array<string | '[]'> = []
  const parts = fieldPath.split('.')

  for (const part of parts) {
    if (part.endsWith('[]')) {
      const name = part.slice(0, -2)
      if (name) segments.push(name)
      segments.push('[]')
      continue
    }

    if (part) segments.push(part)
  }

  return segments
}

function arraySelector(item: unknown, index: number): string {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = (item as { id?: string | null }).id
    if (typeof id === 'string' && id.trim()) return id.trim()
  }

  return String(index)
}

function tokenizeCanonicalPath(path: string): PathToken[] {
  const tokens: PathToken[] = []
  const parts = path.split('.')

  for (const part of parts) {
    const arrayMatch = part.match(/^(.+)\[([^\]]+)\]$/)
    if (arrayMatch) {
      tokens.push({ type: 'key', name: arrayMatch[1] })
      tokens.push({ type: 'array', selector: arrayMatch[2] })
      continue
    }

    tokens.push({ type: 'key', name: part })
  }

  return tokens
}

function resolveArrayItem(array: unknown[], selector: string): Record<string, unknown> | null {
  const byId = array.find(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      String((item as { id?: string | null }).id ?? '') === selector,
  )

  if (byId && typeof byId === 'object') {
    return byId as Record<string, unknown>
  }

  const index = Number(selector)
  if (Number.isInteger(index) && index >= 0 && index < array.length) {
    const item = array[index]
    if (item && typeof item === 'object') return item as Record<string, unknown>
  }

  return null
}

export function collectLocalizedStrings(
  data: Record<string, unknown> | null | undefined,
  fieldPath: string,
): LocalizedStringField[] {
  if (!data) return []

  const segments = parseFieldPath(fieldPath)
  return walkCollect(data, segments, '')
}

function walkCollect(
  node: unknown,
  segments: Array<string | '[]'>,
  pathPrefix: string,
): LocalizedStringField[] {
  if (segments.length === 0) return []

  const [head, ...rest] = segments

  if (head === '[]') {
    if (!Array.isArray(node)) return []

    const results: LocalizedStringField[] = []
    for (let index = 0; index < node.length; index++) {
      const item = node[index]
      if (!item || typeof item !== 'object') continue

      const selector = arraySelector(item, index)
      const parentPath = pathPrefix ? `${pathPrefix}[${selector}]` : `[${selector}]`
      results.push(...walkCollect(item, rest, parentPath))
    }

    return results
  }

  if (!node || typeof node !== 'object' || Array.isArray(node)) return []

  const record = node as Record<string, unknown>
  const nextNode = record[head]
  const nextPrefix = pathPrefix ? `${pathPrefix}.${head}` : head

  if (rest.length === 0) {
    if (typeof nextNode !== 'string') return []
    const value = nextNode.trim()
    return value ? [{ path: nextPrefix, value }] : []
  }

  return walkCollect(nextNode, rest, nextPrefix)
}

export function collectLocalizedRichText(
  data: Record<string, unknown> | null | undefined,
  fieldPath: string,
): LocalizedRichTextField[] {
  if (!data) return []

  const segments = parseFieldPath(fieldPath)
  return walkCollectRichText(data, segments, '')
}

function walkCollectRichText(
  node: unknown,
  segments: Array<string | '[]'>,
  pathPrefix: string,
): LocalizedRichTextField[] {
  if (segments.length === 0) return []

  const [head, ...rest] = segments

  if (head === '[]') {
    if (!Array.isArray(node)) return []

    const results: LocalizedRichTextField[] = []
    for (let index = 0; index < node.length; index++) {
      const item = node[index]
      if (!item || typeof item !== 'object') continue

      const selector = arraySelector(item, index)
      const parentPath = pathPrefix ? `${pathPrefix}[${selector}]` : `[${selector}]`
      results.push(...walkCollectRichText(item, rest, parentPath))
    }

    return results
  }

  if (!node || typeof node !== 'object' || Array.isArray(node)) return []

  const record = node as Record<string, unknown>
  const nextNode = record[head]
  const nextPrefix = pathPrefix ? `${pathPrefix}.${head}` : head

  if (rest.length === 0) {
    if (!isLexicalRichText(nextNode)) return []
    return [{ path: nextPrefix, value: nextNode }]
  }

  return walkCollectRichText(nextNode, rest, nextPrefix)
}

function descendOrCreate(current: unknown, key: string): Record<string, unknown> | null {
  if (!current || typeof current !== 'object' || Array.isArray(current)) return null

  const record = current as Record<string, unknown>
  const next = record[key]

  if (next && typeof next === 'object' && !Array.isArray(next)) {
    return next as Record<string, unknown>
  }

  const created: Record<string, unknown> = {}
  record[key] = created
  return created
}

export function setLocalizedString(
  root: Record<string, unknown>,
  canonicalPath: string,
  value: string,
): boolean {
  const tokens = tokenizeCanonicalPath(canonicalPath)
  if (tokens.length === 0) return false

  let current: unknown = root

  for (let index = 0; index < tokens.length - 1; index++) {
    const token = tokens[index]

    if (token.type === 'key') {
      const next = descendOrCreate(current, token.name)
      if (!next) return false
      current = next
      continue
    }

    if (!Array.isArray(current)) return false
    current = resolveArrayItem(current, token.selector)
  }

  const last = tokens[tokens.length - 1]
  if (last.type !== 'key' || !current || typeof current !== 'object' || Array.isArray(current)) {
    return false
  }

  ;(current as Record<string, unknown>)[last.name] = value
  return true
}

export function setLocalizedRichText(
  root: Record<string, unknown>,
  canonicalPath: string,
  value: Record<string, unknown>,
): boolean {
  const tokens = tokenizeCanonicalPath(canonicalPath)
  if (tokens.length === 0) return false

  let current: unknown = root

  for (let index = 0; index < tokens.length - 1; index++) {
    const token = tokens[index]

    if (token.type === 'key') {
      const next = descendOrCreate(current, token.name)
      if (!next) return false
      current = next
      continue
    }

    if (!Array.isArray(current)) return false
    current = resolveArrayItem(current, token.selector)
  }

  const last = tokens[tokens.length - 1]
  if (last.type !== 'key' || !current || typeof current !== 'object' || Array.isArray(current)) {
    return false
  }

  ;(current as Record<string, unknown>)[last.name] = value
  return true
}

export function indexLocalizedStrings(
  fields: LocalizedStringField[],
): Map<string, string> {
  return new Map(fields.map((field) => [field.path, field.value]))
}
