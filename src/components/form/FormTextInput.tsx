import React, { ReactNode } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInputProps } from 'react-native';
import { FormFieldShell } from './FormFieldShell';

type FormTextInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  left?: ReactNode;
  right?: ReactNode;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
};

/** Glass text field bound to react-hook-form; supports nested paths like `boundaries.east`. */
export function FormTextInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  helperText,
  left,
  right,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect,
  multiline,
  maxLength,
  editable = true,
  returnKeyType,
  onSubmitEditing,
}: FormTextInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <FormFieldShell
          label={label}
          required={required}
          error={error?.message}
          helperText={helperText}
          left={left}
          right={right}
          inputProps={{
            placeholder,
            value: value == null ? '' : String(value),
            onChangeText: onChange,
            onBlur,
            keyboardType,
            autoCapitalize,
            autoCorrect,
            multiline,
            maxLength,
            editable,
            returnKeyType,
            onSubmitEditing,
            style: editable ? undefined : { opacity: 0.6 },
          }}
        />
      )}
    />
  );
}
