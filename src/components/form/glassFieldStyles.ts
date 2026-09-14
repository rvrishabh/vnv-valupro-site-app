import { StyleSheet } from 'react-native';
import { glassPanel } from '../../theme/glassSurface';
import { darkColors } from '../../theme/colors';

export const glassFieldStyles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    color: darkColors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  required: {
    color: darkColors.primary,
  },
  inputRow: {
    ...glassPanel,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
  },
  inputRowError: {
    borderColor: darkColors.destructive,
  },
  input: {
    flex: 1,
    color: darkColors.foreground,
    fontSize: 16,
    paddingVertical: 13,
  },
  inputMultiline: {
    minHeight: 96,
  },
  left: {
    marginRight: 10,
  },
  right: {
    marginLeft: 8,
  },
  error: {
    color: darkColors.destructive,
    fontSize: 12,
    marginTop: 6,
  },
  helper: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    marginTop: 6,
  },
});

export const glassPlaceholderColor = 'rgba(255, 255, 255, 0.4)';
