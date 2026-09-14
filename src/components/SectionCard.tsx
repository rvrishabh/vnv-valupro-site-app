import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { darkColors } from '../theme/colors';
import { GlassPanel } from './GlassPanel';

type SectionCardProps = {
  title: string;
  icon?: string;
  /** Short right-aligned hint, e.g. "3 / 10". */
  meta?: string;
  children: ReactNode;
};

export function SectionCard({ title, icon, meta, children }: SectionCardProps) {
  return (
    <GlassPanel padded style={styles.card}>
      <View style={styles.header}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={darkColors.primary} />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {children}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: darkColors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
});
