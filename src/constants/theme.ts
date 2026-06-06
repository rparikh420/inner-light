/**
 * Inner Light Design System
 *
 * Neumorphic, violet-based theme with mindful green accents.
 * Light source: top-left. Dual shadows (light + dark) on monochromatic surfaces.
 * Fonts: Lora (headings, serif), Raleway (body, sans-serif) -- using System defaults for V0.
 * Spacing: 4/8dp scale. Touch targets: min 44x44pt.
 * Icons: @expo/vector-icons (Ionicons, MaterialIcons, FontAwesome) -- no emoji icons.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: '#7C3AED',
  secondary: '#8B5CF6',
  accent: '#059669',

  background: '#FAF5FF',
  foreground: '#0F172A',

  muted: '#F7F3FD',
  border: '#EFE7FC',

  destructive: '#DC2626',

  card: '#FFFFFF',

  shadowLight: '#FFFFFF',
  shadowDark: '#D4C4E8',
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'System', // swap to 'Lora' once custom fonts are loaded
    body: 'System',    // swap to 'Raleway' once custom fonts are loaded
  },

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing (4/8dp scale)
// ---------------------------------------------------------------------------

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Neumorphic Shadows
//
// Light source: top-left.
// Each style provides iOS shadow properties and Android elevation.
// ---------------------------------------------------------------------------

export const SHADOWS = {
  raised: {
    light: {
      shadowColor: COLORS.shadowLight,
      shadowOffset: { width: -4, height: -4 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
    dark: {
      shadowColor: COLORS.shadowDark,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
    },
    elevation: 4,
  },

  pressed: {
    light: {
      shadowColor: COLORS.shadowLight,
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
    },
    dark: {
      shadowColor: COLORS.shadowDark,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
    },
    elevation: 2,
  },

  flat: {
    light: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    dark: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    elevation: 0,
  },
} as const;

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

export const SCREEN_PADDING = 20;
