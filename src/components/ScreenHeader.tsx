import { useNavigation } from '@react-navigation/native';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { glassCardStyles } from '../theme/glassSurface';
import { darkColors } from '../theme/colors';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, showBack = true, onBack, right }: ScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => navigation.goBack())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[glassCardStyles.iconBadge, styles.iconButton]}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={darkColors.foreground} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
  },
  titles: {
    flex: 1,
  },
  title: {
    color: darkColors.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
});
