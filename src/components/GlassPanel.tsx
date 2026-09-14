import React, { ReactNode, useCallback } from 'react';
import { Platform, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { authGlass, glassCardStyles } from '../theme/glassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  /** @deprecated kept for backwards-compatible props; press feedback is now animated. */
  activeOpacity?: number;
  disabled?: boolean;
  /**
   * Position of this panel within a staggered entrance sequence (e.g. list index).
   * Omit to render without an entrance animation (default — safe for reused/static panels).
   */
  enterIndex?: number;
  /** Extra delay (ms) added before the stagger offset kicks in. */
  enterDelay?: number;
};

const PRESS_SCALE = 0.97;
const STAGGER_STEP_MS = 55;
const PRESS_TINT = 'rgba(255, 255, 255, 0.13)';

export function GlassPanel({
  children,
  style,
  padded = false,
  onPress,
  disabled,
  enterIndex,
  enterDelay = 0,
}: GlassPanelProps) {
  const panelStyle = padded ? glassCardStyles.padded : glassCardStyles.base;
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 320 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, [pressed]);

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }],
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [authGlass.background, PRESS_TINT],
    ),
  }));

  const entering =
    enterIndex !== undefined
      ? FadeInDown.delay(enterDelay + enterIndex * STAGGER_STEP_MS)
          .springify()
          .damping(17)
          .mass(0.55)
      : undefined;

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        entering={entering}
        style={[panelStyle, cardDepth, style, pressAnimatedStyle, disabled && disabledStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View entering={entering} style={[panelStyle, cardDepth, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * Soft outer shadow so cards lift off the gradient background.
 * Android's `elevation` renders a rectangular shadow that ignores the card's
 * borderRadius on a translucent surface, showing up as a hard dark boundary
 * behind the rounded corners — so on Android we rely on the border alone,
 * matching how subtle the iOS shadow already reads in practice.
 */
const cardDepth: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  default: {},
}) as ViewStyle;

const disabledStyle: ViewStyle = {
  opacity: 0.5,
};
