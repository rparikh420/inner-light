/**
 * Inner Light — Warm Editorial Design System
 *
 * Inspired by Calm's warmth + Co-Star's restraint + Labyrinthos's card art.
 * Off-black with warmth, elevated surfaces, gold as the guiding accent.
 * Buttons are visible. Cards are findable. The art is the hero.
 */

import { Platform, StyleSheet } from 'react-native';

export const COLORS = {
  // backgrounds — warm off-black, NOT pure black
  bg: '#0D0D0F',
  surface: '#161618',        // elevated card/surface — visible but subtle
  surfaceHover: '#1E1E22',   // pressed/active surface

  // text
  fg: '#F0EDE8',             // warm white, not harsh #FFF
  fgSecondary: '#9A958E',    // warm gray, readable on surfaces

  // accent — gold is the soul of the app
  accent: '#C9A87C',         // desaturated warm gold — visible, not garish
  accentSoft: 'rgba(201,168,124,0.12)', // gold tint for backgrounds
  accentBorder: 'rgba(201,168,124,0.25)', // gold border for special elements

  // purple — subtle, atmospheric, never dominant
  purple: '#6B5B95',              // desaturated purple for occasional accents
  purpleSoft: 'rgba(107,91,149,0.08)', // purple tint for surfaces
  purpleBorder: 'rgba(107,91,149,0.20)', // purple border for special moments

  // functional
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',
  danger: '#E06060',         // desaturated red
  success: '#6BAF8D',        // desaturated green
} as const;

export const TYPE = {
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: COLORS.fg,
  },
  body: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    color: COLORS.fg,
  },
  secondary: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    color: COLORS.fgSecondary,
  },
  accent: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: COLORS.accent,
  },
} as const;

// Generous spacing — the design breathes
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  huge: 80,
} as const;

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

// Reusable surface style — subtle elevated card
export const SURFACE = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.lg,
  },
  cardAccent: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    padding: S.lg,
  },
});

// Button presets — visible, touchable, warm
export const BUTTON = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: S.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  primaryText: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0D0D0F',
    letterSpacing: 0.5,
  },
  ghost: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: S.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 44,
  },
  ghostText: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.fgSecondary,
  },
});

export const SCREEN_PADDING = 24;
