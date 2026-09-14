import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import {
  resolveStatusPill,
  StatusPillDomain,
} from './resolveStatusPill';
import { StatusPillVariant, statusPillVariants } from './statusPill.theme';

export type StatusPillProps = {
  /** Raw status value — resolved via the central registry when `label` is omitted. */
  status?: string | null;
  /** Domain hint for statuses that differ by context (e.g. refund vs invoice). */
  domain?: StatusPillDomain;
  /** Explicit label (overrides resolved label). */
  label?: string;
  /** Explicit tone (overrides resolved variant). */
  variant?: StatusPillVariant;
  style?: StyleProp<ViewStyle>;
};

export function StatusPill({
  status,
  domain = 'default',
  label,
  variant,
  style,
}: StatusPillProps) {
  const resolved = resolveStatusPill(status, domain);
  const displayLabel = label ?? resolved.label;
  const displayVariant = variant ?? resolved.variant;
  const colors = statusPillVariants[displayVariant];

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={[{ backgroundColor: colors.backgroundColor }, style]}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: colors.textColor }}
      >
        {displayLabel}
      </Text>
    </View>
  );
}
