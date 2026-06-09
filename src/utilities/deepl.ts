/** DeepL target/source language codes (uppercase) mapped from site locale codes */
const DEEPL_LOCALE_MAP: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  nl: 'NL',
  el: 'EL',
}

function resolveDeepLLocale(locale: string): string | null {
  const normalized = locale.trim().toLowerCase()
  return DEEPL_LOCALE_MAP[normalized] ?? null
}


type DeepLTranslateResponse = {
  translations?: Array<{ text?: string }>
}

/**
 * Translate text via the DeepL API.
 * Returns null when the API is unavailable, misconfigured, or the request fails.
 */
export async function translateWithDeepL(
  text: string,
  targetLanguage: string,
  sourceLanguage = 'en',
): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed) return null

  const apiKey = process.env.DEEPL_API_KEY?.trim()
  if (!apiKey) {
    console.warn('[deepl] DEEPL_API_KEY is not configured')
    return null
  }

  const targetLang = resolveDeepLLocale(targetLanguage)
  if (!targetLang) {
    console.warn(`[deepl] Unsupported target language: ${targetLanguage}`)
    return null
  }

  const sourceLang = resolveDeepLLocale(sourceLanguage) ?? 'EN'
  if (targetLang === sourceLang) return trimmed

  const body = new URLSearchParams({
    text: trimmed,
    target_lang: targetLang,
    source_lang: sourceLang,
  })
  const apiUrl = process.env.DEEPL_API_URL?.trim() ?? 'https://api.deepl.com'
  try {
    const response = await fetch(`${apiUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[deepl] API error ${response.status}: ${errorBody}`)
      return null
    }

    const data = (await response.json()) as DeepLTranslateResponse
    const translated = data.translations?.[0]?.text?.trim()
    return translated || null
  } catch (error) {
    console.error('[deepl] Request failed:', error)
    return null
  }
}
