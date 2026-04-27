/**
 * iOS Theme Constants
 * Minimal single theme implementation
 */

import { PlatformColor } from 'react-native';

export const COLORS = {
  // Background - use system colors for automatic light/dark mode
  background: PlatformColor('systemBackground'),
  secondaryBackground: PlatformColor('secondarySystemBackground'),
  tertiaryBackground: PlatformColor('tertiarySystemBackground'),
  card: PlatformColor('secondarySystemBackground'),
  cardBorder: PlatformColor('separator'),

  // Text
  text: PlatformColor('label'),
  secondaryText: PlatformColor('secondaryLabel'),
  muted: PlatformColor('tertiaryLabel'),

  // Primary (Vibrant Orange)
  primary: '#FF9500',
  primaryMuted: 'rgba(255,149,0,0.15)',
  primaryBorder: 'rgba(255,149,0,0.30)',

  // Status
  success: '#34C759',

  // Input
  inputBg: PlatformColor('tertiarySystemBackground'),
  inputBorder: PlatformColor('separator'),
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 980,
} as const;

export const TYPOGRAPHY = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.374,
  },
  title1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 31,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: -0.374,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 25,
    letterSpacing: -0.374,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 19,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 17,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;
