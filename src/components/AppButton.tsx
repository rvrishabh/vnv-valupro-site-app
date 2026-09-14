import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { authGlass } from '../theme/glassSurface';
import { darkColors } from '../theme/colors';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  /** `primary` is the solid gold CTA; `secondary` is a glass outline button. */
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: AppButtonProps) {
  const isInteractionDisabled = Boolean(disabled || loading);
  const isPrimary = variant === 'primary';
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={isInteractionDisabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isInteractionDisabled}
      // NOTE: keep this a plain array, not a `({ pressed }) => [...]` function.
      // nativewind's css-interop wraps Pressable and doesn't resolve
      // function-style props — it silently drops the computed styles,
      // leaving the button with no background/border/sizing at all.
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isInteractionDisabled && styles.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInteractionDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? darkColors.ctaForeground : darkColors.foreground} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: darkColors.cta,
    shadowColor: darkColors.cta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: authGlass.background,
    borderWidth: 1,
    borderColor: authGlass.border,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelPrimary: {
    color: darkColors.ctaForeground,
  },
  labelSecondary: {
    color: darkColors.foreground,
  },
});
