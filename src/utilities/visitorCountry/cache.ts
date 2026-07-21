const STORAGE_KEY = 'roumpos-visitor-country'
/** Cache detected country for 30 days — location rarely changes for the same browser. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

type CachedVisitorCountry = {
  countryCode: string
  expiresAt: number
}

function readEntry(): CachedVisitorCountry | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedVisitorCountry
    if (!parsed?.countryCode || typeof parsed.expiresAt !== 'number') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function readCachedVisitorCountry(): string | null {
  return readEntry()?.countryCode.toLowerCase() ?? null
}

export function writeCachedVisitorCountry(countryCode: string): void {
  if (typeof window === 'undefined') return

  const normalized = countryCode.trim().toLowerCase()
  if (!normalized || normalized.length !== 2) return

  try {
    const entry: CachedVisitorCountry = {
      countryCode: normalized,
      expiresAt: Date.now() + TTL_MS,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore quota / private mode errors.
  }
}
