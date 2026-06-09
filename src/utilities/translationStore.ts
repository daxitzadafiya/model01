type PendingItem = {
  fallback: string
}

type BatchResponse = {
  translations?: Record<string, string>
}

const resolved = new Map<string, string>()
const pending = new Map<string, PendingItem>()
const listeners = new Set<() => void>()

let batchLanguage = 'en'
let flushScheduled = false

function entryKey(language: string, key: string): string {
  return `${language.trim().toLowerCase() || 'en'}::${key}`
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function scheduleFlush(): void {
  if (flushScheduled) return
  flushScheduled = true

  queueMicrotask(() => {
    flushScheduled = false
    void flushBatch()
  })
}

async function flushBatch(): Promise<void> {
  if (pending.size === 0) return

  const language = batchLanguage
  const items = Array.from(pending.entries()).map(([key, { fallback }]) => ({
    key,
    fallback,
  }))

  pending.clear()

  try {
    const response = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, items }),
    })

    if (!response.ok) {
      for (const { key, fallback } of items) {
        resolved.set(entryKey(language, key), fallback)
      }
      notify()
      return
    }

    const data = (await response.json()) as BatchResponse
    const translations = data.translations ?? {}

    for (const { key, fallback } of items) {
      const text = translations[key] ?? fallback
      resolved.set(entryKey(language, key), text)
    }
  } catch {
    for (const { key, fallback } of items) {
      resolved.set(entryKey(language, key), fallback)
    }
  }

  notify()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isTranslationResolved(key: string, language: string): boolean {
  return resolved.has(entryKey(language, key))
}

export function getTranslationSnapshot(
  key: string,
  language: string,
  fallbackValue: string,
): string {
  return resolved.get(entryKey(language, key)) ?? fallbackValue
}

export function requestTranslation(
  key: string,
  language: string,
  fallbackValue: string,
): void {
  const lang = language.trim().toLowerCase() || 'en'
  batchLanguage = lang

  if (resolved.has(entryKey(lang, key))) return

  pending.set(key, { fallback: fallbackValue })
  scheduleFlush()
}

