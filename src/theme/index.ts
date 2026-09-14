import { configureFonts, MD3DarkTheme } from 'react-native-paper';
import { darkColors } from './colors';
import { APP_FONT_FAMILY } from './globalFont';

const paperFonts = configureFonts({ config: { fontFamily: APP_FONT_FAMILY } });

export { GradientBackground } from './GradientBackground';
export { APP_FONT_FAMILY, applyGlobalFont } from './globalFont';
export { darkColors, darkGradientColors } from './colors';
export {
  authGlass,
  glassCardStyles,
  glassListItemSpacing,
  glassPanel,
  glassSurface,
} from './glassSurface';

export const darkPaperTheme = {
  ...MD3DarkTheme,
  roundness: 12,
  fonts: paperFonts,
  colors: {
    ...MD3DarkTheme.colors,
    background: darkColors.background,
    surface: 'transparent',
    primary: darkColors.primary,
    onPrimary: darkColors.onPrimary,
    error: darkColors.destructive,
    outline: '#3D5A8C',
    secondary: darkColors.secondary,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: 'transparent',
      level2: 'transparent',
      level3: 'transparent',
    },
  },
};
