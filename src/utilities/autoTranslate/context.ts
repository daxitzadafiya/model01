export const AUTO_TRANSLATING_CONTEXT_KEY = 'autoTranslating'

export function isAutoTranslating(context: Record<string, unknown> | undefined): boolean {
  return context?.[AUTO_TRANSLATING_CONTEXT_KEY] === true
}
