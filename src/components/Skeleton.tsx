import React, { ReactNode, useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { authGlass } from '../theme/glassSurface';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const BONE_COLOR = 'rgba(255, 255, 255, 0.07)';
const SWEEP_WIDTH = 140;
const SWEEP_MS = 1300;

/**
 * A single loading placeholder: a rounded bone with a soft light sweep
 * crossing it left-to-right, looped. Every skeleton layout in the app is
 * built from these, sized and arranged to match the real content so the
 * swap-in doesn't jump.
 */
export function Bone({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const translateX = useSharedValue(-SWEEP_WIDTH);

  useEffect(() => {
    translateX.value = -SWEEP_WIDTH;
    translateX.value = withRepeat(
      withTiming(400, { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, [translateX]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: BONE_COLOR, overflow: 'hidden' },
        style,
      ]}
    >
      <AnimatedGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { width: SWEEP_WIDTH }, sweepStyle]}
      />
    </View>
  );
}

/**
 * Glass-card wrapper matching `GlassPanel`'s padded surface, so a skeleton
 * card sits at the exact size and position its real content will take.
 */
export function SkeletonCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[cardStyle, style]}>{children}</View>;
}

const cardStyle: ViewStyle = {
  backgroundColor: authGlass.background,
  borderWidth: 1,
  borderColor: authGlass.border,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
};
