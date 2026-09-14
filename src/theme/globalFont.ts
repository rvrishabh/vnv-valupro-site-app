import { Text, TextInput } from 'react-native';

/**
 * App-wide font family. Points at "Plus Jakarta Sans" (free, OFL-licensed)
 * as a close stand-in for Aeonik Pro, which is a paid/commercial font we
 * can't bundle without a license. See src/assets/fonts/README.md for how to
 * link the actual font files (or swap in real Aeonik Pro if you own it).
 *
 * Until the .ttf files are added and linked (`npx react-native-asset`),
 * this is a harmless no-op — React Native silently falls back to the
 * platform default font for any unresolved fontFamily.
 */
export const APP_FONT_FAMILY = 'PlusJakartaSans-Regular';

let applied = false;

/**
 * Injects a default fontFamily onto every RN <Text>/<TextInput> so screens
 * that don't explicitly use the Tailwind font-* classes still pick up the
 * app font. Call once, as early as possible (e.g. top of App.tsx).
 */
export function applyGlobalFont() {
  if (applied) {
    return;
  }
  applied = true;

  const TextAny = Text as unknown as { defaultProps?: { style?: unknown } };
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [
    { fontFamily: APP_FONT_FAMILY },
    TextAny.defaultProps.style,
  ];

  const TextInputAny = TextInput as unknown as {
    defaultProps?: { style?: unknown };
  };
  TextInputAny.defaultProps = TextInputAny.defaultProps || {};
  TextInputAny.defaultProps.style = [
    { fontFamily: APP_FONT_FAMILY },
    TextInputAny.defaultProps.style,
  ];
}
