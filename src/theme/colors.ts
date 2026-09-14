/** Top → bottom gradient for main screens — VNV navy ramp (matches the admin portal). */
export const darkGradientColors = ['#15305F', '#061533'] as const;

export const darkColors = {
  /* Core surfaces */
  background: '#061533',
  foreground: '#F7F7F5',
  surface: '#0A1F44',
  surfaceVariant: '#15305F',
  card: 'transparent',
  glassBorder: 'rgba(255, 255, 255, 0.18)',

  /* Text */
  onBackground: '#F7F7F5',
  onSurface: '#F7F7F5',
  mutedForeground: '#B7CBE0',

  /* Brand — gold is the VNV accent, used for primary CTAs */
  primary: '#C9A84C',
  primarySoft: '#D8BE72',
  onPrimary: '#061533',

  cta: '#C9A84C',
  ctaForeground: '#061533',

  secondary: '#15305F',
  accent: '#6E9AF7',

  /* Status */
  success: '#22C55E',
  warning: '#F59E0B',
  destructive: '#EF4444',
  info: '#6E9AF7',

  /* Borders / inputs */
  border: 'rgba(255, 255, 255, 0.14)',
  input: '#15305F',
  ring: '#C9A84C',

  /* Bottom sheet / modal */
  modalOverlay: 'rgba(0, 0, 0, 0.58)',
  modalSurface: '#0A1F44',
};
