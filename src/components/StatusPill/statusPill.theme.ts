import { darkColors } from '../../theme/colors';

export type StatusPillVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted'
  | 'neutral';

export type StatusPillColors = {
  backgroundColor: string;
  textColor: string;
};

export const statusPillVariants: Record<StatusPillVariant, StatusPillColors> = {
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    textColor: darkColors.success,
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    textColor: darkColors.warning,
  },
  destructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    textColor: darkColors.destructive,
  },
  info: {
    backgroundColor: 'rgba(91, 141, 239, 0.25)',
    textColor: darkColors.info,
  },
  muted: {
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    textColor: darkColors.mutedForeground,
  },
  neutral: {
    backgroundColor: darkColors.secondary,
    textColor: darkColors.mutedForeground,
  },
};
