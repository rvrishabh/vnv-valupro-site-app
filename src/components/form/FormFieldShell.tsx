import React, { ReactNode } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import {
  glassFieldStyles,
  glassPlaceholderColor,
} from './glassFieldStyles';

type FormFieldShellProps = {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  left?: ReactNode;
  right?: ReactNode;
  inputProps: TextInputProps;
};

export function FormFieldShell({
  label,
  required,
  error,
  helperText,
  left,
  right,
  inputProps,
}: FormFieldShellProps) {
  const {
    style,
    placeholderTextColor = glassPlaceholderColor,
    multiline,
    ...restInputProps
  } = inputProps;

  return (
    <View style={glassFieldStyles.field}>
      <Text style={glassFieldStyles.label}>
        {label}
        {required ? <Text style={glassFieldStyles.required}> *</Text> : null}
      </Text>
      <View
        style={[
          glassFieldStyles.inputRow,
          multiline ? glassFieldStyles.inputRowMultiline : null,
          error ? glassFieldStyles.inputRowError : null,
        ]}
      >
        {left ? <View style={glassFieldStyles.left}>{left}</View> : null}
        <TextInput
          {...restInputProps}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          placeholderTextColor={placeholderTextColor}
          style={[
            glassFieldStyles.input,
            multiline ? glassFieldStyles.inputMultiline : null,
            style,
          ]}
        />
        {right ? <View style={glassFieldStyles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={glassFieldStyles.error}>{error}</Text> : null}
      {!error && helperText ? (
        <Text style={glassFieldStyles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}
