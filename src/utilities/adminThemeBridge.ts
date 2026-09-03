import {
  buildGoogleFontsStylesheetUrl,
  getActiveGoogleFontFamily,
  THEME_FONT_MODE_GOOGLE,
} from '@/globals/Theme/googleFonts'
import { resolveThemeCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'

/**
 * Maps Theme → Custom CSS (`--color-*`) onto Payload admin chrome + our custom.scss tokens.
 * Auth + logged-in shell both read `--admin-*` / `--theme-*` at runtime.
 */
export function buildAdminThemeBridgeCSS(): string {
  return `
:root,
html[data-theme='light'],
html[data-theme='dark'] {
  --admin-ink: var(--color-on-surface, #1d1b17);
  --admin-primary: var(--color-primary, #000000);
  --admin-tertiary: var(--color-tertiary, #755b00);
  --admin-tertiary-soft: var(--color-tertiary-container, #c9a84c);
  --admin-cream: var(--color-surface-cream, var(--color-background, #fef9f1));
  --admin-sand: var(--color-surface-container-low, #f8f3ec);
  --admin-surface: var(--color-surface-container, #f2ede6);
  --admin-paper: var(--color-surface-container-lowest, #ffffff);
  --admin-muted: var(--color-on-surface-variant, #444748);
  --admin-outline: var(--color-outline-variant, #c4c7c7);
}

html[data-theme='light'] {
  --theme-bg: var(--color-background, var(--admin-cream));
  --theme-elevation-0: var(--color-surface-container-lowest, var(--admin-paper));
  --theme-elevation-50: var(--color-surface-container-low, var(--admin-sand));
  --theme-elevation-100: var(--color-surface-container, var(--admin-surface));
  --theme-elevation-150: var(--color-surface-container-high, #ece7e0);
  --theme-elevation-200: var(--color-surface-container-highest, #e7e2db);
  --theme-border-color: color-mix(in srgb, var(--admin-ink) 10%, transparent);
  --theme-text: var(--color-on-surface, var(--admin-ink));
  --theme-success-100: color-mix(in srgb, var(--admin-tertiary) 12%, white);
  --theme-success-250: color-mix(in srgb, var(--admin-tertiary-soft) 70%, white);
  --theme-success-400: var(--admin-tertiary-soft);
  --theme-success-500: var(--admin-tertiary);
  --theme-success-600: var(--admin-tertiary);
  --theme-success-800: var(--color-on-tertiary-container, #503d00);
}

html[data-theme='light'] .btn--style-primary {
  --bg-color: var(--admin-primary);
  --color: var(--color-on-primary, #ffffff);
  --hover-bg: var(--admin-tertiary);
  --hover-color: var(--color-on-tertiary, #ffffff);
}
`.trim()
}

export function resolveAdminThemeFontCSS(args: {
  fontMode?: string | null
  googleFonts?: Array<{ family?: string | null; active?: boolean | null }> | null
}): {
  fontCSS: string
  stylesheetUrl: string | null
} {
  const outfit = "'Outfit', ui-sans-serif, system-ui, sans-serif"
  const garamond = "'EB Garamond', Georgia, 'Times New Roman', serif"

  if (args.fontMode === THEME_FONT_MODE_GOOGLE) {
    const family = getActiveGoogleFontFamily(args.googleFonts)
    if (family) {
      const quoted = `'${family.replace(/'/g, "\\'")}'`
      const stack = `${quoted}, ui-sans-serif, system-ui, sans-serif`
      return {
        fontCSS: `:root {\n  --font-theme-body: ${stack};\n  --font-theme-headline: ${stack};\n}\n`,
        stylesheetUrl: buildGoogleFontsStylesheetUrl(family),
      }
    }
  }

  return {
    fontCSS: `:root {\n  --font-theme-body: ${outfit};\n  --font-theme-headline: ${garamond};\n}\n`,
    stylesheetUrl: null,
  }
}

export function buildAdminThemeStylePayload(args: {
  customCSS?: string | null
  fontMode?: string | null
  googleFonts?: Array<{ family?: string | null; active?: boolean | null }> | null
}): {
  css: string
  stylesheetUrl: string | null
} {
  const themeCSS = resolveThemeCustomCSS(args.customCSS).replace(/\r\n/g, '\n')
  const fonts = resolveAdminThemeFontCSS({
    fontMode: args.fontMode,
    googleFonts: args.googleFonts,
  })

  return {
    css: `${fonts.fontCSS}${themeCSS}\n${buildAdminThemeBridgeCSS()}\n`,
    stylesheetUrl: fonts.stylesheetUrl,
  }
}
