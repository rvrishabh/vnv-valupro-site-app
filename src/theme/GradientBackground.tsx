import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { darkGradientColors } from './colors';

type GradientBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GradientBackground({
  children,
  style,
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[...darkGradientColors]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}
