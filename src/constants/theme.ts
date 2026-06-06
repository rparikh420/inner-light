/**
 * Inner Light Design System -- Cinematic Dark Mode + Mystical Premium
 *
 * Inspired by: Co-Star astrology, Calm meditation, modern tarot aesthetics.
 * Dark base with subtle blue undertones, violet interactive elements,
 * warm gold accents for spiritual/tarot elements.
 *
 * Fonts: Playfair Display (headings), Inter (body) -- using System defaults for V0.
 * Spacing: 4/8dp scale. Touch targets: min 44x44pt.
 * Icons: Ionicons only -- no emojis.
 *
 * IMPORTANT: No neumorphic shadows on dark backgrounds. Use hairline borders
 * and subtle glow effects instead for depth and elevation.
 */

import { StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  /** Deepest black -- used for gradient endpoints and modals */
  bgDeep: '#020203',
  /** Dark base with slight blue undertone -- primary screen background */
  bgBase: '#0A0A12',
  /** Elevated surfaces -- floating headers, bottom sheets */
  bgElevated: '#141420',
  /** Card backgrounds */
  bgCard: '#1A1A2E',
  /** Semi-transparent glass overlay */
  surface: 'rgba(255,255,255,0.05)',

  /** Primary text -- passes 4.5:1 on bgCard */
  foreground: '#EDEDEF',
  /** Secondary / muted text */
  foregroundMuted: '#8A8F98',

  /** Violet -- interactive / CTA elements */
  primary: '#7C3AED',
  /** Glow behind primary buttons & actions */
  primaryGlow: 'rgba(124,58,237,0.2)',
  /** Light violet -- secondary interactive elements */
  secondary: '#A78BFA',

  /** Warm gold -- spiritual / tarot accent */
  accent: '#D4A574',
  /** Gold glow for mystical highlights */
  accentGlow: 'rgba(212,165,116,0.15)',

  /** Subtle glass border for cards and dividers */
  border: 'rgba(255,255,255,0.08)',

  /** Error / destructive actions */
  destructive: '#EF4444',
  /** Success states */
  success: '#10B981',
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  fontFamily: {
    /** Swap to 'Playfair Display' once custom fonts are loaded */
    heading: 'System',
    /** Swap to 'Inter' once custom fonts are loaded */
    body: 'System',
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
// Card Style
//
// Standard card treatment for dark mode: solid bgCard fill with a hairline
// border for edge definition. No neumorphic shadows -- they break on dark.
// ---------------------------------------------------------------------------

export const CARD_STYLE = {
  backgroundColor: COLORS.bgCard,
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: COLORS.border,
} as const;

// ---------------------------------------------------------------------------
// Glow Effects
//
// Subtle colored glow behind key interactive and mystical elements.
// Uses iOS shadowColor + shadowRadius. On Android, pair with elevation
// or a semi-transparent View behind the element.
// ---------------------------------------------------------------------------

export const GLOW = {
  /** Purple glow for primary buttons and interactive elements */
  primaryGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Gold glow for spiritual / tarot accented elements */
  accentGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// Press Feedback
//
// Animated scale + opacity for touchable elements.
// Apply with Animated.spring({ toValue: PRESS.scale, useNativeDriver: true })
// ---------------------------------------------------------------------------

export const PRESS = {
  scale: 0.97,
  opacity: 0.8,
  springConfig: {
    damping: 15,
    stiffness: 150,
    mass: 1,
    useNativeDriver: true,
  },
} as const;

// ---------------------------------------------------------------------------
// Layout Constants
// ---------------------------------------------------------------------------

export const SCREEN_PADDING = 20;
