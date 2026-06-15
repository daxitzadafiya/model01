import { DEFAULT_THEME_COLORS } from '@/globals/Theme/siteThemeTokens.mjs'

export type NotificationEmailTheme = {
  primary?: string | null
  secondary?: string | null
  tertiary?: string | null
  surface?: string | null
  background?: string | null
}

export const DEFAULT_NOTIFICATION_EMAIL_THEME: NotificationEmailTheme = {
  primary: DEFAULT_THEME_COLORS.primary,
  secondary: DEFAULT_THEME_COLORS.secondary,
  tertiary: DEFAULT_THEME_COLORS.tertiary,
  surface: DEFAULT_THEME_COLORS.surface,
  background: DEFAULT_THEME_COLORS.background,
}

export type ResolvedNotificationEmailPalette = {
  accent: string
  accentLight: string
  accentShadow: string
  pageBackground: string
  cardBackground: string
  footerBackground: string
  calloutBackground: string
  timestampBackground: string
  textPrimary: string
  textMuted: string
  border: string
}

type Rgb = { r: number; g: number; b: number }

function normalizeHex(hex: string): string | null {
  const value = hex.trim()
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (!match) return null

  const raw = match[1]
  if (raw.length === 3) {
    return `#${raw
      .split('')
      .map((char) => char + char)
      .join('')}`
  }

  return `#${raw.toLowerCase()}`
}

function parseHex(hex: string): Rgb | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const value = normalized.slice(1)
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function mixHex(colorA: string, colorB: string, weight: number): string {
  const a = parseHex(colorA)
  const b = parseHex(colorB)
  if (!a || !b) return colorA

  const ratio = Math.min(1, Math.max(0, weight))
  return toHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  })
}

function hexWithAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex

  const clampedAlpha = Math.min(1, Math.max(0, alpha))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`
}

export type ResolvedNotificationEmailTheme = {
  primary: string
  secondary: string
  tertiary: string
  surface: string
  background: string
}

function resolveColor(value: string | null | undefined, fallback: string): string {
  return normalizeHex(value ?? '') ?? fallback
}

export function resolveNotificationEmailTheme(
  theme?: Partial<NotificationEmailTheme> | null,
): ResolvedNotificationEmailTheme {
  return {
    primary: resolveColor(theme?.primary, DEFAULT_THEME_COLORS.primary),
    secondary: resolveColor(theme?.secondary, DEFAULT_THEME_COLORS.secondary),
    tertiary: resolveColor(theme?.tertiary, DEFAULT_THEME_COLORS.tertiary),
    surface: resolveColor(theme?.surface, DEFAULT_THEME_COLORS.surface),
    background: resolveColor(theme?.background, DEFAULT_THEME_COLORS.background),
  }
}

export function buildNotificationEmailPalette(
  theme?: Partial<NotificationEmailTheme> | null,
): ResolvedNotificationEmailPalette {
  const colors = resolveNotificationEmailTheme(theme)

  return {
    accent: colors.tertiary,
    accentLight: mixHex(colors.tertiary, '#ffffff', 0.62),
    accentShadow: hexWithAlpha(colors.tertiary, 0.05),
    pageBackground: colors.background,
    cardBackground: '#ffffff',
    footerBackground: colors.surface,
    calloutBackground: mixHex(colors.surface, colors.tertiary, 0.12),
    timestampBackground: mixHex(colors.surface, colors.background, 0.5),
    textPrimary: colors.primary,
    textMuted: colors.secondary,
    border: mixHex(colors.secondary, '#ffffff', 0.82),
  }
}
