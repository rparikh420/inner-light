/**
 * Inner Light — Luxury Editorial Design System
 *
 * Three colors. Nothing else.
 * The card art is the only visual element. Everything else is typography.
 */

import { Platform } from 'react-native';

export const COLORS = {
  bg: '#000000',
  fg: '#FFFFFF',
  muted: '#666666',
  accent: '#D4A574',
  border: 'rgba(255,255,255,0.06)',
  danger: '#EF4444',
  success: '#10B981',
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
  muted: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    color: COLORS.muted,
  },
  accent: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: COLORS.accent,
  },
} as const;

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
  sm: 4,
  md: 8,
  lg: 12,
  pill: 9999,
} as const;

export const SCREEN_PADDING = 24;
