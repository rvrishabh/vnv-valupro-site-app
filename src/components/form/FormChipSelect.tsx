import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authGlass, glassCardStyles } from '../../theme/glassSurface';
import { darkColors } from '../../theme/colors';
import { glassFieldStyles } from './glassFieldStyles';

type FormChipSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: readonly string[];
  required?: boolean;
  /** Multi-select stores a string[]; single-select stores a string. */
  multiple?: boolean;
  helperText?: string;
};

/**
 * Tap-to-pick chips for the paper form's circle-one fields (authority,
 * structure type, yes/no). Tapping the selected chip again clears a
 * single-select, so an optional answer can be undone.
 */
export function FormChipSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  multiple,
  helperText,
}: FormChipSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selected: string[] = multiple
          ? Array.isArray(value)
            ? value
            : []
          : value
          ? [String(value)]
          : [];

        const toggle = (option: string) => {
          if (multiple) {
            onChange(
              selected.includes(option)
                ? selected.filter(item => item !== option)
                : [...selected, option],
            );
            return;
          }
          onChange(selected.includes(option) ? '' : option);
        };

        return (
          <View style={glassFieldStyles.field}>
            <Text style={glassFieldStyles.label}>
              {label}
              {required ? <Text style={glassFieldStyles.required}> *</Text> : null}
            </Text>
            <View style={styles.row}>
              {options.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => toggle(option)}
                    activeOpacity={0.7}
                    accessibilityRole={multiple ? 'checkbox' : 'radio'}
                    accessibilityState={{ checked: isSelected }}
                    style={[
                      glassCardStyles.pill,
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {error ? (
              <Text style={glassFieldStyles.error}>{error.message}</Text>
            ) : helperText ? (
              <Text style={glassFieldStyles.helper}>{helperText}</Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  chipSelected: {
    backgroundColor: 'rgba(201, 168, 76, 0.28)',
    borderColor: authGlass.selectedBorder,
    borderWidth: 1.5,
  },
  chipLabel: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: darkColors.primarySoft,
    fontWeight: '700',
  },
});
