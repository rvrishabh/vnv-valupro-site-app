import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { darkColors } from '../theme/colors';

type InfoRowProps = {
  icon: string;
  label: string;
  value?: string | null;
  right?: ReactNode;
};

export function InfoRow({ icon, label, value, right }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={20} color={darkColors.mutedForeground} />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '—'}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  body: {
    flex: 1,
  },
  label: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    color: darkColors.foreground,
    fontSize: 15,
    fontWeight: '500',
  },
});
