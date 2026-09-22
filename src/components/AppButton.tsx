import React, { ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { authGlass } from '../theme/glassSurface';
import { darkColors } from '../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

const PRESS_SCALE = 0.97;

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
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 320 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, [pressed]);

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }],
    opacity: 1 - pressed.value * 0.1,
  }));

  return (
    <AnimatedPressable
      onPress={isInteractionDisabled ? undefined : onPress}
      onPressIn={isInteractionDisabled ? undefined : handlePressIn}
      onPressOut={isInteractionDisabled ? undefined : handlePressOut}
      disabled={isInteractionDisabled}
      // NOTE: keep this a plain array, not a `({ pressed }) => [...]` function.
      // nativewind's css-interop wraps Pressable and doesn't resolve
      // function-style props — it silently drops the computed styles,
      // leaving the button with no background/border/sizing at all. The
      // animated scale/opacity comes in as a plain style object here, same
      // as GlassPanel, which is unaffected by that bug.
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && !loading && styles.disabled,
        style,
        pressAnimatedStyle,
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
    </AnimatedPressable>
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
