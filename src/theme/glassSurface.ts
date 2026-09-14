import { StyleSheet, ViewStyle } from 'react-native';

/** Transparent card surfaces — gradient shows through; border defines edges. */
export const glassSurface = {
  background: 'transparent',
  border: 'rgba(255, 255, 255, 0.18)',
  badge: 'rgba(255, 255, 255, 0.1)',
  badgeMuted: 'rgba(255, 255, 255, 0.08)',
} as const;

/** Auth screens — frosted inputs, cards, and list items (canonical glass). */
export const authGlass = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.12)',
  /** Highlight border for a selected row or chip. */
  selectedBorder: 'rgba(201, 168, 76, 0.9)',
} as const;

/** Standard frosted panel — use for all cards, list items, and sections. */
export const glassPanel: ViewStyle = {
  backgroundColor: authGlass.background,
  borderWidth: 1,
  borderColor: authGlass.border,
  borderRadius: 16,
};

export const glassListItemSpacing = {
  marginBottom: 12,
} as const;

export const glassCardStyles = StyleSheet.create({
  base: glassPanel,
  padded: {
    ...glassPanel,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sm: {
    ...glassPanel,
    borderRadius: 12,
  },
  lg: {
    ...glassPanel,
    borderRadius: 16,
  },
  pill: {
    backgroundColor: authGlass.background,
    borderWidth: 1,
    borderColor: authGlass.border,
    borderRadius: 999,
  },
  pillSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },
  iconBadge: {
    backgroundColor: glassSurface.badgeMuted,
    borderWidth: 1,
    borderColor: authGlass.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
