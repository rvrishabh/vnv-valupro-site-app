# App font

This app's sandbox build environment has no outbound internet access, so the
actual font files could not be downloaded/linked automatically. Everything
else (Tailwind config, global default font, react-native-paper theme) is
already wired up to use them — you just need to add the files and link them.

## Option A — free lookalike (already configured)

The app currently references **Plus Jakarta Sans** (OFL-licensed, free) as a
close geometric-sans stand-in for Aeonik Pro.

1. Download the static TTFs from Google Fonts:
   https://fonts.google.com/specimen/Plus+Jakarta+Sans
2. Drop these files into this folder (`src/assets/fonts/`), renamed exactly:
   - `PlusJakartaSans-Regular.ttf`
   - `PlusJakartaSans-Medium.ttf`
   - `PlusJakartaSans-SemiBold.ttf`
   - `PlusJakartaSans-Bold.ttf`
   - `PlusJakartaSans-ExtraBold.ttf`
3. From the project root, run:
   ```
   npx react-native-asset
   ```
   This links the fonts into both the iOS and Android native projects
   (edits `Info.plist` / copies into `android/app/src/main/assets/fonts`).
4. iOS only: `cd ios && pod install`
5. Rebuild the app (`npm run ios` / `npm run android`) — Metro/JS-only
   reloads won't pick up newly linked native fonts.

## Option B — real Aeonik Pro (if you own a license)

CoType Foundry's Aeonik Pro isn't freely distributable. If you have the
licensed `.ttf`/`.otf` files:

1. Drop them into this folder using the **same file names** listed above
   (e.g. rename `AeonikPro-Regular.otf` → `PlusJakartaSans-Regular.ttf`, or
   update the family name in `tailwind.config.js` (`theme.extend.fontFamily`)
   and `src/theme/globalFont.ts` to match your actual file names instead).
2. Follow steps 3-5 above.

## Where the font is applied

- `tailwind.config.js` → `theme.extend.fontFamily` (`font-sans`,
  `font-medium`, `font-semibold`, `font-bold`, `font-extrabold` utility
  classes)
- `src/theme/globalFont.ts` → sets the default `fontFamily` for every RN
  `<Text>` / `<TextInput>` app-wide, so screens that don't use the Tailwind
  classes above still pick up the new font once linked.
- `src/theme/index.ts` (`darkPaperTheme`/`lightPaperTheme`) → react-native-paper
  components (`<Text variant="...">`, buttons, etc.)
